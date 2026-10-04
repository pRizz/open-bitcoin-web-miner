import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('deployment safety boundaries', () => {
  it.each([' M src/App.tsx', '?? src/unpublished.ts'])(
    'rejects unpublished source %s before invoking AWS', (sourceStatus) => {
      // Arrange
      const fixture = mkdtempSync(join(tmpdir(), 'production-deploy-guard-'));
      const awsMarker = join(fixture, 'aws-called');
      const env = {
        ...process.env,
        AWS_REGION: 'us-east-2', S3_BUCKET: 'www.winabitco.in',
        CLOUDFRONT_DISTRIBUTION_ID: 'E3GD8ZGWCJI0MH', DEPLOY_HOST: 'win3bitcoin.com',
        MOCK_GIT_STATUS: sourceStatus, MOCK_AWS_MARKER: awsMarker,
      };
      try {
        // Act
        const result = spawnSync('bash', ['-c', `
          git() { if [[ "$1" == status ]]; then printf '%s\\n' "$MOCK_GIT_STATUS"; else return 99; fi; }
          aws() { touch "$MOCK_AWS_MARKER"; return 99; }
          export -f git aws
          exec bash scripts/deploy-production.sh
        `], { env, encoding: 'utf8', timeout: 10000 });
        // Assert
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('clean worktree, including untracked files');
        expect(existsSync(awsMarker)).toBe(false);
      } finally {
        rmSync(fixture, { recursive: true, force: true });
      }
    },
  );

  it.each(['bucket', 'cloudfront', 'dns', 'all'])('rejects legacy redirect command %s', (command) => {
    // Arrange / Act
    const result = spawnSync('bash', ['scripts/setup-redirect.sh', command], { encoding: 'utf8' });
    // Assert
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('retired');
  });

  it.each(['bucket', 'cloudfront', 'dns'])('rejects direct legacy redirect script %s', (command) => {
    // Arrange / Act
    const result = spawnSync('bash', [`scripts/redirect/${command}.sh`], { encoding: 'utf8' });
    // Assert
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('retired');
  });

  it.each(['scripts/ci/production-preflight.sh', 'scripts/deploy-production.sh'])(
    'rejects a mismatched distribution before AWS effects in %s', (script) => {
      // Arrange
      const env = { ...process.env, GITHUB_REF_NAME: 'main', CLOUDFRONT_DISTRIBUTION_ID: 'EVH2SH6YOOO76' };
      // Act
      const result = spawnSync('bash', [script], { env, encoding: 'utf8' });
      // Assert
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('disagrees with production configuration');
    },
  );
});
