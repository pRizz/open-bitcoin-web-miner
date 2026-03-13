#!/usr/bin/env bash
#
# One-time setup for the S3 redirect bucket: win3bitcoin.com → https://win3bitco.in
# Run this once (or to re-apply redirect config). Does not run on every app deploy.
# Requires: AWS CLI, credentials with s3:CreateBucket and s3:PutBucketWebsite.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/remote-reporting.sh
source "$SCRIPT_DIR/../lib/remote-reporting.sh"
setup_remote_report "setup-redirect-bucket"

BUCKET="win3bitcoin.com"
REGION="${AWS_REGION:-us-east-1}"

# Summary state (for final report)
SUMMARY_BUCKET="skipped"
SUMMARY_WEBSITE="applied"

ensure_bucket() {
  if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
    echo "Bucket $BUCKET already exists."
    return
  fi
  SUMMARY_BUCKET="created"
  echo "Creating S3 bucket: $BUCKET (region: $REGION)"
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=$REGION"
  fi
}

ensure_bucket

echo "Configuring static website redirect to https://win3bitco.in"
aws s3api put-bucket-website --bucket "$BUCKET" --website-configuration '{
  "RedirectAllRequestsTo": {
    "HostName": "win3bitco.in",
    "Protocol": "https"
  }
}'

print_summary() {
  echo ""
  echo "=============================================="
  echo "  S3 REDIRECT BUCKET — SUMMARY REPORT"
  echo "=============================================="
  echo "  Bucket:              $BUCKET"
  echo "  Region:              $REGION"
  echo "  Redirect target:     https://win3bitco.in"
  echo "----------------------------------------------"
  echo "  S3 bucket:           $SUMMARY_BUCKET"
  echo "  Website redirect:    $SUMMARY_WEBSITE"
  echo "----------------------------------------------"
  echo "  S3 website endpoint: $BUCKET.s3-website-$REGION.amazonaws.com"
  echo "  Next step:           Point DNS for $BUCKET to the endpoint above"
  echo "                       (see docs/s3-redirect-setup.md)"
  echo "=============================================="
}

print_summary
