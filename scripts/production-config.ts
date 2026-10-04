import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { productionSite } from '../src/config/production';

export function resolveProductionEnvironment(env: NodeJS.ProcessEnv) {
  const expected = {
    AWS_REGION: productionSite.awsRegion,
    S3_BUCKET: productionSite.bucket,
    CLOUDFRONT_DISTRIBUTION_ID: productionSite.appDistributionId,
    DEPLOY_HOST: productionSite.host,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (env[key] && env[key] !== value) {
      throw new Error(`${key}=${env[key]} disagrees with production configuration (${value}).`);
    }
  }
  return expected;
}

export function validateBuildMetadata(metadata: unknown, expectedCommit: string) {
  if (!metadata || typeof metadata !== 'object') throw new Error('Missing build metadata.');
  const info = metadata as Record<string, unknown>;
  if (info.deployHost !== productionSite.host) throw new Error('Build deployHost is not the canonical production host.');
  if (info.commitSha !== expectedCommit) throw new Error('Build commitSha does not match the published deployment commit.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = resolveProductionEnvironment(process.env);
  if (process.argv[2] === '--check-build') {
    validateBuildMetadata(JSON.parse(readFileSync('dist/build-info.json', 'utf8')), process.argv[3]);
  } else {
    console.log(Object.values(config).join(' '));
  }
}
