#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REDIRECT_DIR="$SCRIPT_DIR/redirect"

print_usage() {
  cat <<'EOF'
Usage:
  ./scripts/setup-redirect.sh bucket
  ./scripts/setup-redirect.sh cloudfront
  ./scripts/setup-redirect.sh dns
  ./scripts/setup-redirect.sh all

Commands:
  bucket      Create or update the S3 redirect bucket
  cloudfront  Create or reuse the ACM certificate and CloudFront distribution
  dns         Create or update Route 53 alias records that point to CloudFront
  all         Run bucket, then cloudfront, then dns when a distribution is available

Notes:
  - The step scripts live under ./scripts/redirect/
  - If R53_HOSTED_ZONE_ID is set, the cloudfront step can already manage Route 53
EOF
}

run_step() {
  local step_name="$1"
  local step_script="$2"

  echo ""
  echo "=============================================="
  echo "  REDIRECT ORCHESTRATOR — $step_name"
  echo "=============================================="
  "$step_script"
}

aws_capture() {
  local output=""
  local exit_code=0

  set +e
  output=$("$@" 2>&1)
  exit_code=$?
  set -e

  printf '%s' "$output"
  return "$exit_code"
}

is_blank_or_none() {
  local value="${1:-}"
  [[ -z "$value" || "$value" == "None" || "$value" == "null" ]]
}

should_run_dns_step() {
  local output=""
  local status=0
  local maybe_dist_id=""

  if [[ -n "${DIST_DOMAIN:-}" ]]; then
    return 0
  fi

  if [[ -n "${DIST_ID:-}" ]]; then
    output=$(aws_capture aws cloudfront get-distribution \
      --id "$DIST_ID" \
      --query 'Distribution.DomainName' \
      --output text) || status=$?

    if [[ "$status" -eq 0 ]] && ! is_blank_or_none "$output"; then
      return 0
    fi

    echo ""
    echo "Skipping dns step: DIST_ID is set, but the CloudFront distribution could not be resolved yet."
    if [[ -n "$output" ]]; then
      echo "$output"
    fi
    return 1
  fi

  output=$(aws_capture aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Aliases.Items || \`[]\`, \`win3bitcoin.com\`)].Id" \
    --output text) || status=$?

  if [[ "$status" -ne 0 ]]; then
    echo ""
    echo "Skipping dns step: unable to confirm that a CloudFront distribution is available yet."
    echo "This usually means the certificate is still pending validation, or the current AWS identity cannot list distributions."
    echo "$output"
    return 1
  fi

  maybe_dist_id="$(printf '%s\n' "$output" | head -1 | tr -d '\r')"
  if is_blank_or_none "$maybe_dist_id"; then
    echo ""
    echo "Skipping dns step: no CloudFront distribution is available for win3bitcoin.com yet."
    echo "This usually means the certificate still needs DNS validation before CloudFront can be created."
    return 1
  fi

  return 0
}

main() {
  local command="${1:-help}"

  case "$command" in
    bucket)
      exec "$REDIRECT_DIR/bucket.sh"
      ;;
    cloudfront)
      exec "$REDIRECT_DIR/cloudfront.sh"
      ;;
    dns)
      exec "$REDIRECT_DIR/dns.sh"
      ;;
    all)
      run_step "bucket" "$REDIRECT_DIR/bucket.sh"
      run_step "cloudfront" "$REDIRECT_DIR/cloudfront.sh"
      if should_run_dns_step; then
        run_step "dns" "$REDIRECT_DIR/dns.sh"
      else
        echo ""
        echo "Redirect orchestration finished without running dns."
        echo "Next:"
        echo "  - Complete any pending ACM validation if needed"
        echo "  - Then rerun ./scripts/setup-redirect.sh dns"
      fi
      ;;
    help|-h|--help|"")
      print_usage
      ;;
    *)
      echo "Error: Unknown redirect command '$command'." >&2
      echo "" >&2
      print_usage >&2
      exit 1
      ;;
  esac
}

main "$@"
