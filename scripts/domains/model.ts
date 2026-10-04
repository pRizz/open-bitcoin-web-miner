import { productionSite } from '../../src/config/production';
import { isDeepStrictEqual } from 'node:util';

export type Phase = 'check' | 'prepare' | 'cutover';
type Items<T> = { Quantity: number; Items?: T[] };
export type Origin = { Id: string; DomainName: string; OriginAccessControlId?: string; [key: string]: unknown };
export type Behavior = {
  TargetOriginId: string;
  ViewerProtocolPolicy: string;
  FunctionAssociations: Items<{ FunctionARN: string; EventType: string }>;
  [key: string]: unknown;
};
export type DistributionConfig = {
  Aliases: Items<string>;
  Origins: Items<Origin>;
  DefaultRootObject: string;
  DefaultCacheBehavior: Behavior;
  CacheBehaviors: Items<Behavior>;
  ViewerCertificate: { ACMCertificateArn: string; [key: string]: unknown };
  HttpVersion: string;
  IsIPV6Enabled: boolean;
  Enabled: boolean;
  [key: string]: unknown;
};
export type DistributionResponse = { ETag: string; DistributionConfig: DistributionConfig };
export type RecordSet = { Name: string; Type: string; Value: string };
export type Certificate = {
  CertificateArn: string;
  DomainName: string;
  SubjectAlternativeNames: string[];
  Status: string;
  Type: string;
  NotAfter?: string;
  RenewalEligibility?: string;
  DomainValidationOptions?: { ValidationMethod: string; ResourceRecord?: RecordSet }[];
};

/** AWS returns deprecated certificate aliases which are not writable configuration changes. */
export function distributionMatches(current: DistributionConfig, desired: DistributionConfig): boolean {
  const normalize = (value: DistributionConfig) => {
    const config = structuredClone(value);
    config.Aliases.Items?.sort();
    delete config.ViewerCertificate.Certificate;
    delete config.ViewerCertificate.CertificateSource;
    return config;
  };
  return isDeepStrictEqual(normalize(current), normalize(desired));
}

/** CloudFront may reorder query keys; repeated values must retain their original order. */
export function redirectMatches(location: string | null, expected: string): boolean {
  if (!location) return false;
  const actual = new URL(location);
  const target = new URL(expected);
  if (actual.origin !== target.origin || actual.pathname !== target.pathname || actual.hash !== target.hash) return false;
  const actualKeys = [...new Set(actual.searchParams.keys())].sort();
  const expectedKeys = [...new Set(target.searchParams.keys())].sort();
  return isDeepStrictEqual(actualKeys, expectedKeys)
    && expectedKeys.every(key => isDeepStrictEqual(actual.searchParams.getAll(key), target.searchParams.getAll(key)));
}

export function parseArguments(argv: string[]): { phase: Phase; apply: boolean } {
  let phase: Phase = 'check';
  let apply = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') { apply = true; continue; }
    if (argv[i] !== '--phase') throw new Error(`Unknown argument: ${argv[i]}`);
    const value = argv[++i];
    if (value !== 'prepare' && value !== 'cutover') throw new Error('Phase must be prepare or cutover');
    phase = value;
  }
  if (apply && phase === 'check') throw new Error('--apply requires an explicit --phase');
  return { phase, apply };
}

export function usableCertificate(cert: Certificate, aliases: readonly string[]): boolean {
  if (cert.Type !== 'AMAZON_ISSUED' || cert.Status !== 'ISSUED' || !cert.NotAfter) return false;
  if (Date.parse(cert.NotAfter) < Date.now() + 30 * 86400_000) return false;
  return aliases.length === cert.SubjectAlternativeNames.length
    && aliases.every(host => cert.SubjectAlternativeNames.includes(host));
}

export function validationRecords(cert: Certificate): RecordSet[] {
  const options = cert.DomainValidationOptions ?? [];
  if (!options.length || options.some(option => option.ValidationMethod !== 'DNS' || !option.ResourceRecord)) {
    throw new Error('ACM DNS validation records are not ready');
  }
  return [...new Map(options.map(option => [option.ResourceRecord!.Name, option.ResourceRecord!])).values()];
}

export function appConfig(current: DistributionConfig, source: DistributionConfig, arn: string): DistributionConfig {
  const origin = source.Origins.Items?.find(item => item.DomainName === `${productionSite.bucket}.s3.${productionSite.awsRegion}.amazonaws.com`);
  if (!origin?.OriginAccessControlId) throw new Error('Expected private app bucket and OAC were not found');
  if (source.CacheBehaviors.Quantity !== 0) throw new Error('Unexpected extra cache behaviors; review before migration');
  return {
    ...current,
    Origins: structuredClone(source.Origins),
    DefaultRootObject: 'index.html',
    DefaultCacheBehavior: {
      ...structuredClone(source.DefaultCacheBehavior),
      ViewerProtocolPolicy: 'redirect-to-https',
      FunctionAssociations: { Quantity: 1, Items: [{ FunctionARN: arn, EventType: 'viewer-request' }] },
    },
    CacheBehaviors: { Quantity: 0 },
    HttpVersion: source.HttpVersion,
    IsIPV6Enabled: true,
  };
}

export function redirectConfig(current: DistributionConfig, functionArn: string, certificateArn: string): DistributionConfig {
  const viewer: DistributionConfig['ViewerCertificate'] = { ...current.ViewerCertificate, ACMCertificateArn: certificateArn };
  delete viewer.Certificate;
  delete viewer.CertificateSource;
  return {
    ...current,
    Aliases: { Quantity: productionSite.redirectAliases.length, Items: [...productionSite.redirectAliases] },
    ViewerCertificate: viewer,
    DefaultCacheBehavior: {
      ...current.DefaultCacheBehavior,
      ViewerProtocolPolicy: 'allow-all',
      FunctionAssociations: { Quantity: 1, Items: [{ FunctionARN: functionArn, EventType: 'viewer-request' }] },
    },
  };
}

export function assertExpectedDistributions(app: DistributionConfig, redirect: DistributionConfig): void {
  if (!app.Enabled || !redirect.Enabled) throw new Error('A migration distribution is disabled');
  const expected = new Set<string>([...productionSite.appAliases, ...productionSite.redirectAliases]);
  const hosts = [...(app.Aliases.Items ?? []), ...(redirect.Aliases.Items ?? [])];
  if (hosts.some(host => !expected.has(host))) throw new Error('Unexpected alias; refusing to modify unrelated domains');
  if (!productionSite.appAliases.every(host => app.Aliases.Items?.includes(host))) {
    throw new Error('The .com aliases are not on the expected app distribution');
  }
  if (!redirect.Aliases.Items?.includes('win3bitco.in')) throw new Error('Legacy distribution does not own win3bitco.in');
}
