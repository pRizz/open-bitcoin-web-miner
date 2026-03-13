#!/usr/bin/env bash
#
# Final Route 53 DNS step for the win3bitcoin.com CloudFront redirect.
# - Auto-detects the public hosted zone for win3bitcoin.com when possible
# - Reuses an existing CloudFront distribution for the alias, or accepts a known ID/domain
# - Creates or updates Route 53 alias A records that point to CloudFront
#
# Optional env:
#   R53_HOSTED_ZONE_ID  - Route 53 hosted zone ID. Auto-detected by default.
#   DIST_ID             - Known CloudFront distribution ID to reuse.
#   DIST_DOMAIN         - Known CloudFront domain name to reuse. If set without DIST_ID,
#                         the script uses DOMAIN and INCLUDE_WWW to decide which records
#                         to create.
#   INCLUDE_WWW         - Included by default. Set to 0 to skip
#                         www.win3bitcoin.com when aliases are not discoverable automatically.
#   DRY_RUN             - Set to 1 to print intended Route 53 changes without applying them.
#
set -euo pipefail
export AWS_PAGER=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/remote-reporting.sh
source "$SCRIPT_DIR/../lib/remote-reporting.sh"
setup_remote_report "setup-redirect-cloudfront-dns"

DOMAIN="win3bitcoin.com"
REGION="${AWS_REGION:-us-east-1}"
S3_WEBSITE_ORIGIN="${DOMAIN}.s3-website-${REGION}.amazonaws.com"
CLOUDFRONT_HOSTED_ZONE_ID="Z2FDTNDATAQYW2"

SUMMARY_ZONE=""
SUMMARY_DIST=""
SUMMARY_RECORDS=""
SUMMARY_DRY_RUN="no"

declare -a RECORD_NAMES=()

include_www() {
  [[ "${INCLUDE_WWW:-1}" != "0" ]]
}

is_dry_run() {
  [[ "${DRY_RUN:-0}" == "1" ]]
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Error: Required command '$command_name' is not installed or not on PATH." >&2
    exit 1
  fi
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

is_access_denied() {
  local output="$1"
  [[ "$output" == *"AccessDenied"* || "$output" == *"AccessDeniedException"* || "$output" == *"not authorized to perform"* ]]
}

is_blank_or_none() {
  local value="${1:-}"
  [[ -z "$value" || "$value" == "None" || "$value" == "null" ]]
}

die_with_aws_error() {
  local context="$1"
  local output="${2:-}"

  echo "Error: $context" >&2
  if [[ -n "$output" ]]; then
    echo "$output" >&2
  fi
  exit 1
}

normalize_hosted_zone_id() {
  local zone_id="${1:-}"
  zone_id="${zone_id#/hostedzone/}"
  zone_id="${zone_id#/hostedzone}"
  zone_id="${zone_id#/}"
  printf '%s\n' "$zone_id"
}

join_record_names() {
  local joined=""
  local name=""

  for name in "${RECORD_NAMES[@]}"; do
    if [[ -z "$joined" ]]; then
      joined="$name"
    else
      joined="$joined, $name"
    fi
  done

  printf '%s\n' "$joined"
}

ensure_default_record_names() {
  if [[ "${#RECORD_NAMES[@]}" -gt 0 ]]; then
    return
  fi

  RECORD_NAMES=("$DOMAIN")
  if include_www; then
    RECORD_NAMES+=("www.$DOMAIN")
  fi
}

load_record_names_from_aliases() {
  local aliases_output="${1:-}"
  local alias=""

  RECORD_NAMES=()

  if ! is_blank_or_none "$aliases_output"; then
    for alias in $aliases_output; do
      case "$alias" in
        "$DOMAIN"|"www.$DOMAIN")
          RECORD_NAMES+=("$alias")
          ;;
      esac
    done
  fi

  ensure_default_record_names
}

resolve_hosted_zone() {
  if [[ -n "${R53_HOSTED_ZONE_ID:-}" ]]; then
    HOSTED_ZONE_ID="$(normalize_hosted_zone_id "$R53_HOSTED_ZONE_ID")"
    if is_blank_or_none "$HOSTED_ZONE_ID"; then
      die_with_aws_error "R53_HOSTED_ZONE_ID was provided but empty after normalization." ""
    fi
    SUMMARY_ZONE="provided (R53_HOSTED_ZONE_ID)"
    echo "Using Route 53 hosted zone from R53_HOSTED_ZONE_ID: $HOSTED_ZONE_ID"
    return
  fi

  local output=""
  local status=0
  local zone_id=""
  local zone_name=""
  local private_zone=""

  output=$(aws_capture aws route53 list-hosted-zones-by-name \
    --dns-name "$DOMAIN" \
    --max-items 1 \
    --query 'HostedZones[0].[Id,Name,Config.PrivateZone]' \
    --output text) || status=$?

  if [[ "$status" -ne 0 ]]; then
    die_with_aws_error "Unable to auto-detect the Route 53 hosted zone for $DOMAIN." "$output"
  fi

  read -r zone_id zone_name private_zone <<<"$output"
  zone_id="$(normalize_hosted_zone_id "$zone_id")"

  if is_blank_or_none "$zone_id" || [[ "$zone_name" != "${DOMAIN}." ]]; then
    die_with_aws_error "No exact public Route 53 hosted zone was found for $DOMAIN. Set R53_HOSTED_ZONE_ID explicitly." "$output"
  fi

  if [[ "$private_zone" == "True" ]]; then
    die_with_aws_error "The auto-detected hosted zone for $DOMAIN is private. Set R53_HOSTED_ZONE_ID to the public hosted zone instead." "$output"
  fi

  HOSTED_ZONE_ID="$zone_id"
  SUMMARY_ZONE="auto-detected"
  echo "Auto-detected Route 53 hosted zone: $HOSTED_ZONE_ID"
}

load_distribution_details() {
  local dist_id="$1"
  local domain_output=""
  local aliases_output=""
  local origin_output=""

  domain_output=$(aws_capture aws cloudfront get-distribution \
    --id "$dist_id" \
    --query 'Distribution.DomainName' \
    --output text) || die_with_aws_error "Unable to read CloudFront domain name for distribution $dist_id." "$domain_output"

  aliases_output=$(aws_capture aws cloudfront get-distribution \
    --id "$dist_id" \
    --query 'Distribution.DistributionConfig.Aliases.Items' \
    --output text) || die_with_aws_error "Unable to read CloudFront aliases for distribution $dist_id." "$aliases_output"

  origin_output=$(aws_capture aws cloudfront get-distribution \
    --id "$dist_id" \
    --query 'Distribution.DistributionConfig.Origins.Items[0].DomainName' \
    --output text) || die_with_aws_error "Unable to read CloudFront origin for distribution $dist_id." "$origin_output"

  if [[ "$(printf '%s\n' "$origin_output" | tr -d '\r')" != "$S3_WEBSITE_ORIGIN" ]]; then
    die_with_aws_error "CloudFront distribution $dist_id points to origin $(printf '%s\n' "$origin_output" | tr -d '\r') instead of the redirect website origin $S3_WEBSITE_ORIGIN." "Refusing to attach Route 53 redirect records to a non-redirect distribution."
  fi

  DIST_ID="$dist_id"
  DIST_DOMAIN="$(printf '%s\n' "$domain_output" | tr -d '\r')"
  load_record_names_from_aliases "$aliases_output"
}

resolve_distribution() {
  if [[ -n "${DIST_DOMAIN:-}" ]]; then
    DIST_DOMAIN="$(printf '%s\n' "$DIST_DOMAIN" | tr -d '\r')"
    if is_blank_or_none "$DIST_DOMAIN"; then
      die_with_aws_error "DIST_DOMAIN was provided but blank." ""
    fi
    SUMMARY_DIST="provided (DIST_DOMAIN)"
    ensure_default_record_names
    echo "Using CloudFront domain from DIST_DOMAIN: $DIST_DOMAIN"
    return
  fi

  if [[ -n "${DIST_ID:-}" ]]; then
    SUMMARY_DIST="provided (DIST_ID)"
    echo "Using CloudFront distribution from DIST_ID: $DIST_ID"
    load_distribution_details "$DIST_ID"
    echo "  domain: $DIST_DOMAIN"
    return
  fi

  local list_output=""
  local list_status=0
  local existing_id=""

  list_output=$(aws_capture aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Aliases.Items || \`[]\`, \`${DOMAIN}\`)].Id" \
    --output text) || list_status=$?

  if [[ "$list_status" -eq 0 ]]; then
    existing_id="$(printf '%s\n' "$list_output" | head -1 | tr -d '\r')"
  elif is_access_denied "$list_output"; then
    die_with_aws_error "Missing cloudfront:ListDistributions. Set DIST_ID or DIST_DOMAIN explicitly." "$list_output"
  else
    die_with_aws_error "Unable to list CloudFront distributions for alias discovery." "$list_output"
  fi

  if is_blank_or_none "$existing_id"; then
    die_with_aws_error "No CloudFront distribution was found with alias $DOMAIN. Set DIST_ID or DIST_DOMAIN explicitly." "$list_output"
  fi

  SUMMARY_DIST="auto-detected"
  echo "Auto-detected CloudFront distribution: $existing_id"
  load_distribution_details "$existing_id"
  echo "  domain: $DIST_DOMAIN"
}

change_route53_record_set() {
  local description="$1"
  local change_batch="$2"
  local output=""

  if is_dry_run; then
    SUMMARY_DRY_RUN="yes"
    echo "DRY RUN: would update Route 53 for $description in hosted zone $HOSTED_ZONE_ID"
    echo "$change_batch"
    return
  fi

  output=$(aws_capture aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "$change_batch") || die_with_aws_error "Unable to update Route 53 for $description in hosted zone $HOSTED_ZONE_ID." "$output"
}

apply_dns_records() {
  local record_name=""
  local change_batch=""

  SUMMARY_RECORDS="$(join_record_names)"

  for record_name in "${RECORD_NAMES[@]}"; do
    change_batch=$(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${record_name}.",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "$CLOUDFRONT_HOSTED_ZONE_ID",
        "DNSName": "${DIST_DOMAIN}.",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF
)
    change_route53_record_set "CloudFront alias record for $record_name" "$change_batch"
    echo "  A record: $record_name -> $DIST_DOMAIN"
  done
}

print_summary() {
  echo ""
  echo "=============================================="
  echo "  CLOUDFRONT DNS — SUMMARY REPORT"
  echo "=============================================="
  echo "  Domain:              $DOMAIN"
  echo "  Route 53 zone:       $SUMMARY_ZONE (id: $HOSTED_ZONE_ID)"
  echo "  CloudFront source:   $SUMMARY_DIST"
  if [[ -n "${DIST_ID:-}" ]]; then
    echo "  CloudFront dist id:  $DIST_ID"
  fi
  echo "  CloudFront domain:   $DIST_DOMAIN"
  echo "  Records upserted:    $SUMMARY_RECORDS"
  echo "  Dry run:             $SUMMARY_DRY_RUN"
  echo "=============================================="
}

require_command aws
resolve_hosted_zone
resolve_distribution
apply_dns_records
print_summary
