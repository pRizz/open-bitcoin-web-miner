import { productionSite } from '../../src/config/production';
import { aws, log, snapshot } from './aws';

export const deployRole = 'GitHubActionsLeadingZeroLabProductionDeploy';
export const deployPolicy = 'LeadingZeroLabProductionDeploy';
type Statement = { Sid: string; Effect: string; Action: string | string[]; Resource: string | string[]; [key: string]: unknown };
export type RoleResponse = { PolicyDocument: { Statement: Statement[]; [key: string]: unknown }; [key: string]: unknown };

export async function ensureDeployPermissions(account: string, phase: 'prepare' | 'cutover') {
  const response = await aws<RoleResponse>('iam', 'get-role-policy', '--role-name', deployRole, '--policy-name', deployPolicy);
  const policy = structuredClone(response.PolicyDocument);
  const maybeStatement = policy.Statement.find(item => item.Sid === 'InvalidateProductionCloudFront');
  if (!maybeStatement || maybeStatement.Effect !== 'Allow') throw new Error('Unexpected deployment IAM policy; manual review needed');
  const ids = phase === 'prepare'
    ? [productionSite.redirectDistributionId, productionSite.appDistributionId]
    : [productionSite.appDistributionId];
  maybeStatement.Action = ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'];
  maybeStatement.Resource = ids.map(id => `arn:aws:cloudfront::${account}:distribution/${id}`);
  if (JSON.stringify(policy) === JSON.stringify(response.PolicyDocument)) {
    await log(`Deployment permissions already correct for ${phase}`);
    return;
  }
  const file = await snapshot(`iam-${phase}-desired`, policy);
  await aws('iam', 'put-role-policy', '--role-name', deployRole, '--policy-name', deployPolicy, '--policy-document', `file://${file}`);
  await log(`Deployment invalidation permissions scoped to ${ids.join(', ')}`);
}
