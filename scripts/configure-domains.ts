#!/usr/bin/env bun
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { productionSite } from '../src/config/production';
import { getEdgeSource } from './edge-routing';
import { aws, cli, initializeRun, log, runDirectory, snapshot, waitFor } from './domains/aws';
import { appConfig, assertExpectedDistributions, DistributionResponse, parseArguments, redirectConfig, validationRecords } from './domains/model';
import { describeCertificate, ensureRedirectCertificate, ensureValidation } from './domains/certificates';
import { ensureFunction, ensureWebsiteDns, functionNames, updateDistribution } from './domains/configuration';
import { deployPolicy, deployRole, ensureDeployPermissions, RoleResponse } from './domains/permissions';
import { backendHost, verifyMiningWebSocket } from './domains/backend';

const execute = promisify(execFile);
type Distribution = { Distribution: { Status: string; DomainName: string } };

async function captureBaseline() {
  const app = await aws<DistributionResponse>('cloudfront', 'get-distribution-config', '--id', productionSite.appDistributionId);
  const redirect = await aws<DistributionResponse>('cloudfront', 'get-distribution-config', '--id', productionSite.redirectDistributionId);
  assertExpectedDistributions(app.DistributionConfig, redirect.DistributionConfig);
  await snapshot('app-before', app);
  await snapshot('redirect-before', redirect);
  const appCert = await describeCertificate(app.DistributionConfig.ViewerCertificate.ACMCertificateArn);
  const redirectCert = await describeCertificate(redirect.DistributionConfig.ViewerCertificate.ACMCertificateArn);
  await snapshot('certificates-before', { app: appCert, redirect: redirectCert });
  const identity = await aws<{ Account: string }>('sts', 'get-caller-identity');
  if (!appCert.CertificateArn.includes(`:${identity.Account}:`) || !redirectCert.CertificateArn.includes(`:${identity.Account}:`)) {
    throw new Error('Certificate account does not match the current AWS identity');
  }
  await snapshot('iam-before', await aws<RoleResponse>('iam', 'get-role-policy', '--role-name', deployRole, '--policy-name', deployPolicy));
  await snapshot('github-before', await cli('gh', ['variable', 'list', '--env', 'production', '--json', 'name,value']));
  for (const zone of Object.values(productionSite.hostedZones)) {
    await snapshot(`zone-${zone}-before`, await aws('route53', 'list-resource-record-sets', '--hosted-zone-id', zone));
  }
  return { app, redirect, appCert, account: identity.Account };
}

async function checkWebsite(): Promise<boolean> {
  let healthy = true;
  for (const host of [...productionSite.appAliases, ...productionSite.redirectAliases]) {
    try {
      const response = await fetch(`https://${host}/home-bitcoin-mining?probe=one&probe=two&escaped=a%2Fb`, {
        redirect: 'manual', signal: AbortSignal.timeout(15_000),
      });
      const expected = `${productionSite.origin}/home-bitcoin-mining?probe=one&probe=two&escaped=a%2Fb`;
      const good = host === productionSite.host
        ? response.status === 200
        : response.status === 301 && response.headers.get('location') === expected;
      healthy &&= good;
      await log(`${host}: ${response.status}; canonical routing ${good ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      healthy = false;
      await log(`${host}: TLS/HTTP FAIL: ${String(error)}`);
    }
  }
  return healthy;
}

async function assertPublishedApp() {
  const head = (await execute('git', ['rev-parse', 'HEAD'])).stdout.trim();
  const slug = (await execute('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'])).stdout.trim();
  const published = (await execute('gh', ['api', `repos/${slug}/commits/main`, '--jq', '.sha'])).stdout.trim();
  if (head !== published) throw new Error('Cutover requires HEAD to match published GitHub main');
  const response = await fetch(`${productionSite.origin}/build-info.json`, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
  if (response.status !== 200) throw new Error('Canonical build-info.json is not served directly');
  const build = await response.json() as { commitSha: string; deployHost: string };
  if (build.commitSha !== head || build.deployHost !== productionSite.host) throw new Error('Canonical app does not yet serve the published .com build');
  const home = await fetch(productionSite.origin, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
  if (home.status !== 200) throw new Error('Canonical homepage is not healthy');
  const api = await fetch(`https://${backendHost}`, { method: 'OPTIONS',
    headers: { Origin: productionSite.origin, 'Access-Control-Request-Method': 'GET' }, signal: AbortSignal.timeout(15_000) });
  const origin = api.headers.get('access-control-allow-origin');
  if (!api.ok || (origin !== '*' && origin !== productionSite.origin)) throw new Error('Backend does not allow canonical origin');
  const network = await fetch(`https://${backendHost}/network-info`, {
    headers: { Origin: productionSite.origin }, redirect: 'manual', signal: AbortSignal.timeout(15_000),
  });
  if (!network.ok) throw new Error('Mining network API is unavailable');
  const data = await network.json() as { status: string; data?: { block_height: number } };
  if (data.status !== 'success' || !data.data || !Number.isFinite(data.data.block_height)) throw new Error('Mining network API returned invalid data');
  await verifyMiningWebSocket();
  await log(`Published .com app and backend validated at ${head}`);
}

async function assertNoDeployment() {
  const runs = await cli<{ status: string }[]>('gh', ['run', 'list', '--workflow', 'deploy-production.yml',
    '--limit', '20', '--json', 'status']);
  if (runs.some(run => run.status !== 'completed')) throw new Error('A production deployment is still running; wait before applying');
}

async function assertFunctionSources() {
  const account = (await aws<{ Account: string }>('sts', 'get-caller-identity')).Account;
  const descriptions = await aws<{ FunctionList: { Items?: { Name: string }[] } }>('cloudfront', 'list-functions');
  for (const mode of ['app', 'redirect'] as const) {
    if (!descriptions.FunctionList.Items?.some(fn => fn.Name === functionNames[mode])) throw new Error(`Missing ${mode} function`);
    // TLS probes verify routing behavior; the LIVE function source is captured separately for drift review.
    const file = `${runDirectory}/${functionNames[mode]}-live.js`;
    await aws('cloudfront', 'get-function', '--name', functionNames[mode], '--stage', 'LIVE', file);
    const { readFile } = await import('node:fs/promises');
    if (await readFile(file, 'utf8') !== getEdgeSource(mode)) throw new Error(`LIVE ${mode} function differs from checked-in source`);
  }
  return account;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  await initializeRun();
  await log(`${args.apply ? 'APPLY' : 'READ ONLY'} phase=${args.phase}; snapshots=${runDirectory}`);
  const baseline = await captureBaseline();
  if (!args.apply) {
    if (args.phase !== 'check') {
      await log(`Plan ${args.phase}: ${args.phase === 'prepare' ? 'prepare redirect certificate, publish functions, promote .com app and grant transition invalidations' : 'require published .com build, enable four legacy HTTPS redirects, verify all aliases, restrict invalidation role'}`);
      await snapshot('summary', { ...args, success: true, applied: false });
      return;
    }
    const healthy = await checkWebsite();
    if (!healthy) throw new Error('Canonical domain health check failed');
    await assertFunctionSources();
    const certs = [baseline.appCert, await describeCertificate(baseline.redirect.DistributionConfig.ViewerCertificate.ACMCertificateArn)];
    for (const cert of certs) {
      if (cert.Status !== 'ISSUED' || cert.RenewalEligibility !== 'ELIGIBLE') throw new Error('Certificate is not issued/renewal eligible');
      for (const record of validationRecords(cert)) {
        const result = await execute('dig', ['+short', '+time=3', '+tries=1', 'CNAME', record.Name]);
        if (result.stdout.trim().toLowerCase() !== record.Value.toLowerCase()) throw new Error(`Missing public validation CNAME ${record.Name}`);
      }
    }
    await snapshot('summary', { ...args, success: true, applied: false });
    return;
  }
  await assertNoDeployment();
  const redirectCertificate = await ensureRedirectCertificate();
  await snapshot('redirect-certificate-selected', redirectCertificate);
  await ensureValidation(baseline.appCert);
  if (args.phase === 'prepare') {
    const arn = await ensureFunction('app');
    await ensureFunction('redirect');
    const desired = appConfig(baseline.app.DistributionConfig, baseline.redirect.DistributionConfig, arn);
    await updateDistribution(productionSite.appDistributionId, baseline.app.ETag, desired);
    const invalidation = await aws<{ Invalidation: { Id: string } }>('cloudfront', 'create-invalidation', '--distribution-id',
      productionSite.appDistributionId, '--paths', '/*');
    await waitFor('old .com redirect invalidation', async () => (await aws<{ Invalidation: { Status: string } }>(
      'cloudfront', 'get-invalidation', '--distribution-id', productionSite.appDistributionId,
      '--id', invalidation.Invalidation.Id)).Invalidation.Status === 'Completed');
    await ensureDeployPermissions(baseline.account, 'prepare');
    await log('.com now serves the app; legacy .in app remains available. Next update GitHub deployment target and publish code.');
  } else {
    await assertPublishedApp();
    const functionArn = await ensureFunction('redirect');
    const desired = redirectConfig(baseline.redirect.DistributionConfig, functionArn, redirectCertificate.CertificateArn);
    await updateDistribution(productionSite.redirectDistributionId, baseline.redirect.ETag, desired);
    const app = await aws<Distribution>('cloudfront', 'get-distribution', '--id', productionSite.appDistributionId);
    const redirect = await aws<Distribution>('cloudfront', 'get-distribution', '--id', productionSite.redirectDistributionId);
    await ensureWebsiteDns(app.Distribution.DomainName, redirect.Distribution.DomainName);
    await waitFor('all canonical website routes', checkWebsite);
    await ensureDeployPermissions(baseline.account, 'cutover');
  }
  await snapshot('summary', { ...args, success: true, applied: true, redirectCertificateArn: redirectCertificate.CertificateArn });
}

main().catch(async error => {
  console.error(error instanceof Error ? error.message : String(error));
  await initializeRun();
  await snapshot('summary', { success: false, error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});
