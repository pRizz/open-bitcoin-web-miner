import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { productionSite } from '../../src/config/production';
import { getEdgeSource } from '../edge-routing';
import { aws, log, snapshot, waitFor, runDirectory } from './aws';
import { DistributionConfig, DistributionResponse, distributionMatches } from './model';

export const functionNames = { app: 'Win3BitcoinAppRouting', redirect: 'Win3BitcoinLegacyRedirect' } as const;

export async function ensureFunction(mode: 'app' | 'redirect'): Promise<string> {
  const name = functionNames[mode];
  const source = getEdgeSource(mode);
  const codeFile = join(runDirectory, `${name}.js`);
  await writeFile(codeFile, source, { mode: 0o600 });
  const list = await aws<{ FunctionList: { Items?: { Name: string }[] } }>('cloudfront', 'list-functions');
  const config = JSON.stringify({ Comment: `Canonical ${productionSite.host} ${mode} routing`, Runtime: 'cloudfront-js-2.0' });
  type FunctionResponse = { ETag: string; FunctionSummary: { FunctionMetadata: { FunctionARN: string; Stage?: string } } };
  let response: FunctionResponse;
  if (list.FunctionList.Items?.some(item => item.Name === name)) {
    response = await aws<FunctionResponse>('cloudfront', 'describe-function', '--name', name, '--stage', 'DEVELOPMENT');
    const saved = join(runDirectory, `${name}-development.js`);
    await aws('cloudfront', 'get-function', '--name', name, '--stage', 'DEVELOPMENT', saved);
    if ((await readFile(saved, 'utf8')) !== source) {
      response = await aws<FunctionResponse>('cloudfront', 'update-function', '--name', name, '--if-match', response.ETag,
        '--function-config', config, '--function-code', `fileb://${codeFile}`);
    }
  } else {
    response = await aws<FunctionResponse>('cloudfront', 'create-function', '--name', name,
      '--function-config', config, '--function-code', `fileb://${codeFile}`);
  }
  const event = await snapshot(`${name}-test-event`, {
    version: '1.0', context: { eventType: 'viewer-request' }, viewer: { ip: '192.0.2.1' },
    request: { method: 'GET', uri: '/home-bitcoin-mining', querystring: { address: { value: 'test%2Bvalue' } },
      headers: { host: { value: mode === 'app' ? productionSite.host : productionSite.redirectAliases[0] } }, cookies: {} },
  });
  const test = await aws<{ TestResult: { FunctionErrorMessage?: string; FunctionOutput: string } }>(
    'cloudfront', 'test-function', '--name', name, '--if-match', response.ETag, '--stage', 'DEVELOPMENT', '--event-object', `fileb://${event}`);
  if (test.TestResult.FunctionErrorMessage) throw new Error(`AWS edge function test failed: ${test.TestResult.FunctionErrorMessage}`);
  const output = JSON.parse(test.TestResult.FunctionOutput) as { request?: { uri: string }; response?: { statusCode: number } };
  if (mode === 'app' ? output.request?.uri !== '/index.html' : output.response?.statusCode !== 301) {
    throw new Error(`AWS edge function returned unexpected ${mode} routing`);
  }
  const liveList = await aws<{ FunctionList: { Items?: { Name: string }[] } }>('cloudfront', 'list-functions', '--stage', 'LIVE');
  let publishedMatches = false;
  if (liveList.FunctionList.Items?.some(item => item.Name === name)) {
    const liveFile = join(runDirectory, `${name}-live-before.js`);
    await aws('cloudfront', 'get-function', '--name', name, '--stage', 'LIVE', liveFile);
    publishedMatches = await readFile(liveFile, 'utf8') === source;
  }
  if (!publishedMatches) await aws('cloudfront', 'publish-function', '--name', name, '--if-match', response.ETag);
  await log(`Published and AWS-tested ${name}`);
  return response.FunctionSummary.FunctionMetadata.FunctionARN;
}

export async function updateDistribution(id: string, expectedEtag: string, desired: DistributionConfig) {
  const fresh = await aws<DistributionResponse>('cloudfront', 'get-distribution-config', '--id', id);
  if (fresh.ETag !== expectedEtag) throw new Error(`Concurrent configuration change to ${id}; rerun after reviewing snapshot`);
  await snapshot(`${id === productionSite.appDistributionId ? 'app' : 'redirect'}-rollback`, fresh);
  if (distributionMatches(fresh.DistributionConfig, desired)) {
    await log(`Distribution ${id} already matches desired state`);
  } else {
    const file = await snapshot(`${id}-desired`, desired);
    await aws('cloudfront', 'update-distribution', '--id', id, '--if-match', fresh.ETag, '--distribution-config', `file://${file}`);
    await log(`Updating distribution ${id}`);
  }
  await waitFor(`${id} deployment`, async () => (await aws<{ Distribution: { Status: string } }>(
    'cloudfront', 'get-distribution', '--id', id)).Distribution.Status === 'Deployed');
}

export async function ensureWebsiteDns(appDomain: string, redirectDomain: string) {
  for (const [domain, zone] of Object.entries(productionSite.hostedZones)) {
    const target = domain === productionSite.host ? appDomain : redirectDomain;
    const records = await aws<{ ResourceRecordSets: { Name: string; Type: string; AliasTarget?: { DNSName: string } }[] }>(
      'route53', 'list-resource-record-sets', '--hosted-zone-id', zone);
    const changes = [domain, `www.${domain}`].flatMap(host => ['A', 'AAAA'].flatMap(type => {
      const maybeRecord = records.ResourceRecordSets.find(record => record.Name === `${host}.` && record.Type === type);
      if (maybeRecord?.AliasTarget?.DNSName === `${target}.`) return [];
      return [{ Action: 'UPSERT', ResourceRecordSet: { Name: host, Type: type, AliasTarget: {
        HostedZoneId: 'Z2FDTNDATAQYW2', DNSName: target, EvaluateTargetHealth: false,
      } } }];
    }));
    if (!changes.length) { await log(`A/AAAA aliases already correct: ${domain}`); continue; }
    const file = await snapshot(`dns-${zone}`, { Comment: 'Canonical .com website aliases', Changes: changes });
    const result = await aws<{ ChangeInfo: { Id: string } }>('route53', 'change-resource-record-sets',
      '--hosted-zone-id', zone, '--change-batch', `file://${file}`);
    await waitFor(`DNS ${domain}`, async () => (await aws<{ ChangeInfo: { Status: string } }>(
      'route53', 'get-change', '--id', result.ChangeInfo.Id)).ChangeInfo.Status === 'INSYNC');
  }
}
