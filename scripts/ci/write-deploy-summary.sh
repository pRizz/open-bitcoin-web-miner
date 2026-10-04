#!/usr/bin/env bash
set -euo pipefail

config_values="$(bun scripts/production-config.ts)"
read -r aws_region bucket distribution deploy_host <<<"$config_values"
deploy_branch="${DEPLOY_BRANCH:-${GITHUB_REF_NAME:-unknown}}"
deploy_sha="${DEPLOY_SHA:-}"
deploy_short_sha="${DEPLOY_SHORT_SHA:-}"
deploy_commit_date="${DEPLOY_COMMIT_DATE:-unknown}"
deploy_status="${DEPLOY_STATUS:-unknown}"
invalidation_display="${INVALIDATION_ID:-not-created}"

commit_line='- Commit: unavailable'
if [[ -n "$deploy_sha" ]]; then
  if [[ -n "${GITHUB_SERVER_URL:-}" && -n "${GITHUB_REPOSITORY:-}" && -n "$deploy_short_sha" ]]; then
    commit_line="- Commit: [${deploy_short_sha}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${deploy_sha})"
  else
    commit_line="- Commit: ${deploy_sha}"
  fi
fi

summary_file="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

{
  echo "## Production deploy"
  echo ""
  echo "- Status: ${deploy_status}"
  echo "- Host: https://${deploy_host}"
  echo "- S3 bucket: ${bucket} (${aws_region})"
  echo "- App distribution: ${distribution}"
  echo "- Branch: ${deploy_branch}"
  echo "${commit_line}"
  echo "- Commit date: ${deploy_commit_date}"
  echo "- CloudFront invalidation: ${invalidation_display}"
} >>"$summary_file"
