#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy-production.sh [--dryrun]

Defaults come from src/config/production.ts.
AWS_REGION, S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID, and DEPLOY_HOST
may be provided only when they match that configuration.
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

dry_run=0
sync_args=()

while (($# > 0)); do
  case "$1" in
    --dryrun)
      dry_run=1
      sync_args+=(--dryrun)
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

config_values="$(bun scripts/production-config.ts)"
read -r AWS_REGION S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID DEPLOY_HOST <<<"$config_values"
export AWS_REGION S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID DEPLOY_HOST

source_status="$(git status --porcelain --untracked-files=all)"
if [[ -n "$source_status" ]]; then
  echo "Production deployments require a clean worktree, including untracked files. Commit and publish source changes, then rebuild before deploying." >&2
  exit 1
fi

if [[ ! -d dist ]]; then
  echo "dist/ was not found. Run bun run build before deploying." >&2
  exit 1
fi

if [[ ! -f dist/build-info.json ]]; then
  echo "dist/build-info.json was not found. Run bun run build:deploy to generate deploy metadata before deploying." >&2
  exit 1
fi

deploy_sha="$(git rev-parse HEAD)"
published_sha="$(git ls-remote origin refs/heads/main)"
published_sha="${published_sha%%[[:space:]]*}"
if [[ "$deploy_sha" != "$published_sha" ]]; then
  echo "Production deployment requires the current published GitHub main commit ($published_sha). Received $deploy_sha." >&2
  exit 1
fi
bun scripts/production-config.ts --check-build "$deploy_sha"

export AWS_DEFAULT_REGION="$AWS_REGION"

echo "Syncing dist/ to s3://$S3_BUCKET/ in region $AWS_REGION"
if [[ "$dry_run" -eq 1 ]]; then
  aws s3 sync dist "s3://$S3_BUCKET/" --delete --exclude '*.map' "${sync_args[@]}"
else
  aws s3 sync dist "s3://$S3_BUCKET/" --delete --exclude '*.map'
fi

if [[ "$dry_run" -eq 1 ]]; then
  echo "Dry run enabled; skipping CloudFront invalidation."
  exit 0
fi

echo "Creating CloudFront invalidation for distribution $CLOUDFRONT_DISTRIBUTION_ID"
invalidation_id="$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths '/*' \
  --query 'Invalidation.Id' \
  --output text)"

echo "Created CloudFront invalidation $invalidation_id"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "invalidation_id=$invalidation_id" >>"$GITHUB_OUTPUT"
fi

echo "Waiting for CloudFront invalidation before checking https://$DEPLOY_HOST"
for attempt in 1 2 3; do
  if aws cloudfront wait invalidation-completed \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --id "$invalidation_id"; then
    break
  fi
  if [[ "$attempt" -eq 3 ]]; then
    echo "Could not confirm CloudFront invalidation completion." >&2
    exit 1
  fi
  echo "Invalidation read failed; retrying after AWS permission/state propagation (attempt $attempt/3)." >&2
  sleep 5
done
bun scripts/check-production.ts "$deploy_sha"
