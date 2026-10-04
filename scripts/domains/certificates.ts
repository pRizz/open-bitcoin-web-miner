import { createHash } from 'node:crypto';
import { productionSite } from '../../src/config/production';
import { aws, log, snapshot, waitFor } from './aws';
import { Certificate, usableCertificate, validationRecords } from './model';

export async function describeCertificate(arn: string): Promise<Certificate> {
  return (await aws<{ Certificate: Certificate }>('acm', 'describe-certificate', '--certificate-arn', arn)).Certificate;
}

export async function ensureValidation(cert: Certificate) {
  const batches = new Map<string, unknown[]>();
  for (const record of validationRecords(cert)) {
    const maybeZone = Object.entries(productionSite.hostedZones).find(([domain]) => record.Name.endsWith(`.${domain}.`));
    if (!maybeZone) throw new Error(`Refusing to write validation outside managed domains: ${record.Name}`);
    const [domain, zoneId] = maybeZone;
    const response = await aws<{ ResourceRecordSets: { Name: string; Type: string; ResourceRecords?: { Value: string }[] }[] }>(
      'route53', 'list-resource-record-sets', '--hosted-zone-id', zoneId);
    const maybeCurrent = response.ResourceRecordSets.find(item => item.Name === record.Name && item.Type === 'CNAME');
    if (maybeCurrent?.ResourceRecords?.[0]?.Value === record.Value) {
      await log(`Validation already correct: ${record.Name}`);
      continue;
    }
    await log(`Restore permanent validation for ${domain}: ${record.Name}`);
    const changes = batches.get(zoneId) ?? [];
    changes.push({ Action: 'UPSERT', ResourceRecordSet: {
      Name: record.Name, Type: 'CNAME', TTL: 300, ResourceRecords: [{ Value: record.Value }],
    } });
    batches.set(zoneId, changes);
  }
  for (const [zoneId, changes] of batches) {
    const file = await snapshot(`validation-${zoneId}`, { Comment: 'Permanent ACM DNS validation', Changes: changes });
    await aws('route53', 'change-resource-record-sets', '--hosted-zone-id', zoneId, '--change-batch', `file://${file}`);
  }
}

export async function ensureRedirectCertificate(): Promise<Certificate> {
  const aliases = productionSite.redirectAliases;
  const list = await aws<{ CertificateSummaryList: { CertificateArn: string; DomainName: string }[] }>(
    'acm', 'list-certificates', '--certificate-statuses', 'ISSUED', 'PENDING_VALIDATION');
  let maybeSelected: Certificate | undefined;
  for (const item of list.CertificateSummaryList) {
    if (!aliases.includes(item.DomainName as typeof aliases[number])) continue;
    const cert = await describeCertificate(item.CertificateArn);
    if (cert.Type !== 'AMAZON_ISSUED' || cert.SubjectAlternativeNames.length !== aliases.length
        || !aliases.every(host => cert.SubjectAlternativeNames.includes(host))) continue;
    if (usableCertificate(cert, aliases)) { maybeSelected = cert; break; }
    if (cert.Status === 'PENDING_VALIDATION') maybeSelected = cert;
  }
  let arn = maybeSelected?.CertificateArn;
  if (!arn) {
    const token = createHash('sha256').update([...aliases].sort().join('|')).digest('hex').slice(0, 32);
    arn = (await aws<{ CertificateArn: string }>('acm', 'request-certificate', '--domain-name', aliases[0],
      '--subject-alternative-names', ...aliases.slice(1), '--validation-method', 'DNS', '--idempotency-token', token)).CertificateArn;
    await log(`Requested redirect certificate: ${arn}`);
  } else await log(`Reusing redirect certificate: ${arn}`);
  const selectedArn = arn;
  await waitFor('redirect certificate DNS records', async () => {
    const cert = await describeCertificate(selectedArn);
    if (!['ISSUED', 'PENDING_VALIDATION'].includes(cert.Status)) throw new Error(`ACM request failed: ${cert.Status}`);
    return Boolean(cert.DomainValidationOptions?.length) && cert.DomainValidationOptions!.every(option => option.ResourceRecord);
  });
  await ensureValidation(await describeCertificate(selectedArn));
  await waitFor('redirect certificate issuance', async () => {
    const cert = await describeCertificate(selectedArn);
    if (!['ISSUED', 'PENDING_VALIDATION'].includes(cert.Status)) throw new Error(`ACM issuance failed: ${cert.Status}`);
    return cert.Status === 'ISSUED';
  });
  return describeCertificate(selectedArn);
}
