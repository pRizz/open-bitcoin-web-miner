#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy-production.sh [--dryrun]

Required environment variables:
  AWS_REGION
  S3_BUCKET
  CLOUDFRONT_DISTRIBUTION_ID
EOF
}

dry_run=0
sync_args=()

while (($# > 0)); do
  case "$1" in
    --dryrun)
      dry_run=1
      sync_args+=(--dryrun)
      shift
      ;;
    -h|--help)
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

required_vars=(AWS_REGION S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: $var_name" >&2
    exit 1
  fi
done

if [[ ! -d dist ]]; then
  echo "dist/ was not found. Run bun run build before deploying." >&2
  exit 1
fi

if [[ ! -f dist/build-info.json ]]; then
  echo "dist/build-info.json was not found. Run bun run build:deploy to generate deploy metadata before deploying." >&2
  exit 1
fi

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
  echo "invalidation_id=$invalidation_id" >> "$GITHUB_OUTPUT"
fi
