import { describe, expect, it } from 'vitest';
import { resolveProductionEnvironment, validateBuildMetadata } from './production-config';

describe('production deployment configuration', () => {
  it('defaults to the canonical app resources', () => {
    // Arrange / Act
    const result = resolveProductionEnvironment({});
    // Assert
    expect(result.DEPLOY_HOST).toBe('win3bitcoin.com');
    expect(result.CLOUDFRONT_DISTRIBUTION_ID).toBe('E3GD8ZGWCJI0MH');
  });

  it.each(['AWS_REGION', 'S3_BUCKET', 'CLOUDFRONT_DISTRIBUTION_ID', 'DEPLOY_HOST'])(
    'rejects a mismatched %s before deployment', (key) => {
      // Arrange
      const env = { [key]: 'wrong' };
      // Act / Assert
      expect(() => resolveProductionEnvironment(env)).toThrow('disagrees');
    },
  );

  it('accepts matching build provenance', () => {
    // Arrange
    const metadata = { deployHost: 'win3bitcoin.com', commitSha: 'published' };
    // Act / Assert
    expect(() => validateBuildMetadata(metadata, 'published')).not.toThrow();
  });

  it('rejects stale build provenance', () => {
    // Arrange
    const metadata = { deployHost: 'win3bitcoin.com', commitSha: 'old' };
    // Act / Assert
    expect(() => validateBuildMetadata(metadata, 'published')).toThrow('commitSha');
  });

  it('rejects builds for the previous host', () => {
    // Arrange
    const metadata = { deployHost: 'win3bitco.in', commitSha: 'published' };
    // Act / Assert
    expect(() => validateBuildMetadata(metadata, 'published')).toThrow('deployHost');
  });
});
