import { describe, expect, it, vi } from 'vitest';
import { productionSite } from '../../src/config/production';
import { appConfig, assertExpectedDistributions, DistributionConfig, distributionMatches, parseArguments, redirectConfig, usableCertificate, validationRecords } from './model';
import { updateDistribution } from './configuration';
import { aws } from './aws';

vi.mock('./aws', () => ({ aws: vi.fn(), log: vi.fn(), snapshot: vi.fn(), waitFor: vi.fn(), runDirectory: '/tmp/domain-test' }));

function config(aliases: string[]): DistributionConfig {
  return {
    Aliases: { Quantity: aliases.length, Items: aliases },
    Origins: { Quantity: 1, Items: [{ Id: 'app-origin', DomainName: `${productionSite.bucket}.s3.us-east-2.amazonaws.com`, OriginAccessControlId: 'oac' }] },
    DefaultRootObject: 'index.html', DefaultCacheBehavior: {
      TargetOriginId: 'app-origin', ViewerProtocolPolicy: 'redirect-to-https', FunctionAssociations: { Quantity: 0 },
      CachePolicyId: 'preserved-cache-policy',
    },
    CacheBehaviors: { Quantity: 0 }, ViewerCertificate: { ACMCertificateArn: 'keep-app-cert' },
    HttpVersion: 'http2and3', IsIPV6Enabled: true, Enabled: true, Comment: 'preserved-comment',
  };
}

describe('domain rollout safeguards', () => {
  it('treats AWS deprecated certificate aliases as unchanged on a rerun', () => {
    // Arrange
    const current = config([...productionSite.redirectAliases]);
    current.ViewerCertificate.Certificate = 'keep-app-cert';
    current.ViewerCertificate.CertificateSource = 'acm';
    const desired = redirectConfig(current, 'same-function', 'keep-app-cert');
    current.DefaultCacheBehavior = desired.DefaultCacheBehavior;

    // Act
    const matches = distributionMatches(current, desired);

    // Assert
    expect(matches).toBe(true);
  });
  it('defaults to read-only health checks', () => {
    expect(parseArguments([])).toEqual({ phase: 'check', apply: false });
  });

  it('planning a named phase does not authorize mutations', () => {
    expect(parseArguments(['--phase', 'prepare'])).toEqual({ phase: 'prepare', apply: false });
  });

  it('requires an explicit phase for applying', () => {
    expect(() => parseArguments(['--apply'])).toThrow('requires an explicit');
  });

  it('preserves primary certificate and unrelated configuration when changing origin', () => {
    // Arrange
    const app = config([...productionSite.appAliases]);
    const legacy = config(['win3bitco.in', 'www.win3bitco.in']);
    app.Origins.Items![0].DomainName = 'old-redirect.s3-website-us-east-1.amazonaws.com';
    const before = structuredClone(legacy);

    // Act
    const desired = appConfig(app, legacy, 'new-app-function');

    // Assert
    expect(desired.Origins).toEqual(legacy.Origins);
    expect(desired.ViewerCertificate).toEqual(app.ViewerCertificate);
    expect(desired.Comment).toBe('preserved-comment');
    expect(legacy).toEqual(before);
  });

  it('includes precisely the four legacy website aliases during cutover', () => {
    // Arrange
    const current = config(['win3bitco.in', 'www.win3bitco.in']);

    // Act
    const desired = redirectConfig(current, 'redirect-function', 'four-host-cert');

    // Assert
    expect(desired.Aliases.Items).toEqual([...productionSite.redirectAliases]);
    expect(desired.ViewerCertificate.ACMCertificateArn).toBe('four-host-cert');
    expect(desired.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('allow-all');
    expect(desired.Origins).toEqual(current.Origins);
  });

  it('rejects unrelated aliases before any rollout', () => {
    // Arrange
    const app = config([...productionSite.appAliases, 'backend.win3bitco.in']);
    const legacy = config(['win3bitco.in']);

    // Act / Assert
    expect(() => assertExpectedDistributions(app, legacy)).toThrow('unrelated domains');
  });

  it('waits until all DNS validation records are present', () => {
    // Arrange
    const cert = { CertificateArn: 'pending', DomainName: 'win3bitco.in', SubjectAlternativeNames: ['win3bitco.in'],
      Status: 'PENDING_VALIDATION', Type: 'AMAZON_ISSUED' };

    // Act / Assert
    expect(() => validationRecords(cert)).toThrow('not ready');
  });

  it('does not reuse an issued certificate missing a legacy alias', () => {
    // Arrange
    const cert = { CertificateArn: 'old', DomainName: 'win3bitco.in', SubjectAlternativeNames: ['win3bitco.in', 'www.win3bitco.in'],
      Status: 'ISSUED', Type: 'AMAZON_ISSUED', NotAfter: '2099-01-01T00:00:00Z' };

    // Act
    const usable = usableCertificate(cert, productionSite.redirectAliases);

    // Assert
    expect(usable).toBe(false);
  });

  it('does not update a concurrently changed distribution', async () => {
    // Arrange
    vi.mocked(aws).mockReset();
    const desired = config([...productionSite.appAliases]);
    vi.mocked(aws).mockResolvedValue({ ETag: 'changed-etag', DistributionConfig: desired });

    // Act / Assert
    await expect(updateDistribution('distribution', 'old-etag', desired)).rejects.toThrow('Concurrent');
    expect(aws).toHaveBeenCalledTimes(1);
    expect(aws).toHaveBeenCalledWith('cloudfront', 'get-distribution-config', '--id', 'distribution');
  });
});
