#!/usr/bin/env bash
#
# One-time setup for HTTPS on win3bitcoin.com via CloudFront (idempotent).
# - Requests or reuses an ACM certificate (us-east-1) for the domain
# - Optionally adds DNS validation CNAMEs via Route 53 (UPSERT)
# - Creates a CloudFront distribution only if none exists for this alias; otherwise reuses it
# - Optionally creates/updates Route 53 A (alias) records to CloudFront (UPSERT)
#
# Prerequisites:
# - Run scripts/redirect/bucket.sh first (S3 bucket + website redirect).
# - AWS CLI configured with credentials that can create ACM certs, CloudFront
#   distributions, and (if using R53) Route 53 record sets.
#
# Optional env:
#   R53_HOSTED_ZONE_ID  - Route 53 hosted zone ID for win3bitcoin.com.
#                         If set, script adds ACM validation CNAMEs and
#                         A records to CloudFront; otherwise it prints
#                         the CNAMEs and exits so you can add them manually,
#                         then rerun after ACM issues the certificate.
#   INCLUDE_WWW         - Included by default. Set to 0 to skip
#                         www.win3bitcoin.com in cert and aliases.
#   CERT_ARN            - Reuse a known ACM certificate ARN and skip certificate lookup.
#                         Useful if IAM allows describe/request but not list.
#   DIST_ID             - Reuse a known CloudFront distribution ID and skip distribution lookup.
#                         Useful if IAM allows get/create but not list.
#
set -euo pipefail
export AWS_PAGER=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/remote-reporting.sh
source "$SCRIPT_DIR/../lib/remote-reporting.sh"
setup_remote_report "setup-redirect-cloudfront"

DOMAIN="win3bitcoin.com"
REGION="${AWS_REGION:-us-east-1}"
# CloudFront uses ACM in us-east-1 only
ACM_REGION="us-east-1"
S3_WEBSITE_ORIGIN="${DOMAIN}.s3-website-${REGION}.amazonaws.com"
CLOUDFRONT_HOSTED_ZONE_ID="Z2FDTNDATAQYW2"
CACHE_POLICY_ID="658327ea-f89d-4fab-a63d-7e88639e58f6"

# Summary state (for final report)
SUMMARY_CERT=""
SUMMARY_VALIDATION=""
SUMMARY_VALIDATION_COUNT=0
SUMMARY_CERT_WAITED="no"
SUMMARY_DIST=""
SUMMARY_DNS=""
SUMMARY_R53_RECORDS=""

include_www() {
  [[ "${INCLUDE_WWW:-1}" != "0" ]]
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

describe_certificate_field() {
  local query="$1"
  local output=""

  output=$(aws_capture aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region "$ACM_REGION" \
    --query "$query" \
    --output text) || die_with_aws_error "Unable to describe ACM certificate $CERT_ARN." "$output"

  printf '%s\n' "$output"
}

describe_named_certificate_field() {
  local cert_arn="$1"
  local query="$2"
  local output=""

  output=$(aws_capture aws acm describe-certificate \
    --certificate-arn "$cert_arn" \
    --region "$ACM_REGION" \
    --query "$query" \
    --output text) || die_with_aws_error "Unable to inspect ACM certificate $cert_arn." "$output"

  printf '%s\n' "$output"
}

certificate_covers_www() {
  local cert_arn="$1"
  local output=""

  output=$(describe_named_certificate_field "$cert_arn" "Certificate.DomainName == 'www.${DOMAIN}' || contains(Certificate.SubjectAlternativeNames, 'www.${DOMAIN}') || contains(Certificate.SubjectAlternativeNames, '*.${DOMAIN}')")

  [[ "$(printf '%s\n' "$output" | tr -d '\r')" == "True" ]]
}

resolve_reusable_certificate() {
  local list_output=""
  local list_status=0
  local cert_arn=""
  local cert_status=""
  local pending_cert_arn=""

  list_output=$(aws_capture aws acm list-certificates \
    --region "$ACM_REGION" \
    --output text \
    --query "CertificateSummaryList[?DomainName=='${DOMAIN}'].CertificateArn") || list_status=$?

  if [[ "$list_status" -ne 0 ]]; then
    if is_access_denied "$list_output"; then
      echo "Warning: Missing acm:ListCertificates. Skipping certificate reuse lookup; set CERT_ARN to reuse a known certificate." >&2
      return
    fi
    die_with_aws_error "Unable to list ACM certificates in $ACM_REGION." "$list_output"
  fi

  for cert_arn in $list_output; do
    if is_blank_or_none "$cert_arn"; then
      continue
    fi

    cert_status="$(describe_named_certificate_field "$cert_arn" 'Certificate.Status')"
    if include_www && ! certificate_covers_www "$cert_arn"; then
      continue
    fi

    if [[ "$cert_status" == "ISSUED" ]]; then
      CERT_ARN="$cert_arn"
      SUMMARY_CERT="reused (existing issued)"
      echo "Using existing certificate: $CERT_ARN"
      return
    fi

    if [[ "$cert_status" == "PENDING_VALIDATION" && -z "$pending_cert_arn" ]]; then
      pending_cert_arn="$cert_arn"
    fi
  done

  if [[ -n "$pending_cert_arn" ]]; then
    CERT_ARN="$pending_cert_arn"
    SUMMARY_CERT="reused (existing pending)"
    echo "Using existing pending certificate: $CERT_ARN"
  fi
}

load_distribution_domain() {
  local dist_id="$1"
  local output=""

  output=$(aws_capture aws cloudfront get-distribution \
    --id "$dist_id" \
    --query 'Distribution.DomainName' \
    --output text) || die_with_aws_error "Unable to read CloudFront distribution $dist_id." "$output"

  DIST_ID="$dist_id"
  DIST_DOMAIN="$(printf '%s\n' "$output" | tr -d '\r')"
}

load_distribution_origin_domain() {
  local dist_id="$1"
  local output=""

  output=$(aws_capture aws cloudfront get-distribution \
    --id "$dist_id" \
    --query 'Distribution.DistributionConfig.Origins.Items[0].DomainName' \
    --output text) || die_with_aws_error "Unable to read CloudFront origin for distribution $dist_id." "$output"

  printf '%s\n' "$output" | tr -d '\r'
}

ensure_redirect_distribution_origin() {
  local dist_id="$1"
  local origin_domain=""

  origin_domain="$(load_distribution_origin_domain "$dist_id")"
  if [[ "$origin_domain" != "$S3_WEBSITE_ORIGIN" ]]; then
    die_with_aws_error "CloudFront distribution $dist_id already has alias $DOMAIN but points to origin $origin_domain instead of the redirect website origin $S3_WEBSITE_ORIGIN." "Update that distribution to use the redirect website origin, or remove the alias before rerunning this script."
  fi
}

distribution_covers_www() {
  local dist_id="$1"
  local output=""

  output=$(aws_capture aws cloudfront get-distribution \
    --id "$dist_id" \
    --query "contains(Distribution.DistributionConfig.Aliases.Items, 'www.${DOMAIN}')" \
    --output text) || die_with_aws_error "Unable to inspect CloudFront aliases for distribution $dist_id." "$output"

  [[ "$(printf '%s\n' "$output" | tr -d '\r')" == "True" ]]
}

print_pending_validation_next_steps() {
  echo ""
  echo "Certificate validation is still pending."
  echo "Next: add the ACM DNS record(s) above, wait for the certificate to become ISSUED, then rerun this script."
  echo "      Current certificate ARN: $CERT_ARN"
}

change_route53_record_set() {
  local description="$1"
  local change_batch="$2"
  local output=""

  output=$(aws_capture aws route53 change-resource-record-sets \
    --hosted-zone-id "$R53_HOSTED_ZONE_ID" \
    --change-batch "$change_batch") || die_with_aws_error "Unable to update Route 53 for $description in hosted zone $R53_HOSTED_ZONE_ID." "$output"
}

require_redirect_bucket() {
  local output=""
  local status=0

  output=$(aws_capture aws s3api head-bucket --bucket "$DOMAIN") || status=$?
  if [[ "$status" -eq 0 ]]; then
    return
  fi

  if [[ "$output" == *"Not Found"* || "$output" == *"(404)"* || "$output" == *"404"* ]]; then
    die_with_aws_error "S3 bucket $DOMAIN does not exist. Run ./scripts/redirect/bucket.sh first or use ./scripts/setup-redirect.sh bucket." "$output"
  fi

  if [[ "$output" == *"Forbidden"* || "$output" == *"(403)"* ]]; then
    die_with_aws_error "S3 bucket $DOMAIN exists but is not accessible with the current AWS identity." "$output"
  fi

  die_with_aws_error "Unable to verify prerequisite S3 bucket $DOMAIN." "$output"
}

require_command aws
require_redirect_bucket

# Resolve ACM certificate (reuse existing issued or request new)
resolve_cert() {
  if [[ -n "${CERT_ARN:-}" ]]; then
    SUMMARY_CERT="provided (CERT_ARN)"
    echo "Using certificate from CERT_ARN: $CERT_ARN"
    return
  fi

  resolve_reusable_certificate
  if [[ -n "${CERT_ARN:-}" ]]; then
    return
  fi

  SUMMARY_CERT="requested (new)"
  echo "Requesting or reusing ACM certificate for $DOMAIN (region: $ACM_REGION)..."
  local request_output=""
  local request_status=0
  if include_www; then
    request_output=$(aws_capture aws acm request-certificate \
      --domain-name "$DOMAIN" \
      --subject-alternative-names "www.${DOMAIN}" \
      --validation-method DNS \
      --region "$ACM_REGION" \
      --query 'CertificateArn' \
      --output text) || request_status=$?
  else
    request_output=$(aws_capture aws acm request-certificate \
      --domain-name "$DOMAIN" \
      --validation-method DNS \
      --region "$ACM_REGION" \
      --query 'CertificateArn' \
      --output text) || request_status=$?
  fi

  if [[ "$request_status" -ne 0 ]]; then
    die_with_aws_error "Unable to request ACM certificate for $DOMAIN in $ACM_REGION." "$request_output"
  fi

  CERT_ARN="$(printf '%s\n' "$request_output" | tr -d '\r')"
  echo "Requested certificate: $CERT_ARN"
  echo "Waiting for ACM to populate validation records..."
  sleep 10
}
resolve_cert

# Ensure certificate is issued (add validation CNAMEs if needed, then wait)
ensure_cert_issued() {
  local status
  status=$(describe_certificate_field 'Certificate.Status')
  if [[ "$status" == "ISSUED" ]]; then
    SUMMARY_VALIDATION="skipped (already issued)"
    SUMMARY_CERT_WAITED="no"
    return
  fi

  if [[ "$status" != "PENDING_VALIDATION" ]]; then
    die_with_aws_error "Certificate $CERT_ARN is in unexpected status '$status'." ""
  fi

  if [[ -n "${R53_HOSTED_ZONE_ID:-}" ]]; then
    SUMMARY_VALIDATION="cnames_upserted"
    echo "Adding ACM validation CNAMEs to Route 53 hosted zone $R53_HOSTED_ZONE_ID..."
    local len i name value change
    len=$(describe_certificate_field 'length(Certificate.DomainValidationOptions)')
    if is_blank_or_none "$len" || [[ "$len" -le 0 ]]; then
      die_with_aws_error "ACM has not returned any validation records for certificate $CERT_ARN yet. Wait a minute and rerun the script." ""
    fi
    for i in $(seq 0 $((len - 1)) 2>/dev/null); do
      name=$(describe_certificate_field "Certificate.DomainValidationOptions[$i].ResourceRecord.Name")
      value=$(describe_certificate_field "Certificate.DomainValidationOptions[$i].ResourceRecord.Value")
      if is_blank_or_none "$name" || is_blank_or_none "$value"; then
        die_with_aws_error "ACM has not populated the validation CNAME for certificate $CERT_ARN yet. Wait a minute and rerun the script." ""
      fi
      ((SUMMARY_VALIDATION_COUNT += 1)) || true
      change=$(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "$name",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "$value"}]
    }
  }]
}
EOF
)
      change_route53_record_set "ACM validation record $name" "$change"
      echo "  Added CNAME $name -> $value"
    done
  else
    SUMMARY_VALIDATION="cnames_printed"
    echo "ACM certificate must be validated via DNS. Add these CNAME records (or set R53_HOSTED_ZONE_ID to automate):"
    local records_output=""
    records_output=$(aws_capture aws acm describe-certificate \
      --certificate-arn "$CERT_ARN" \
      --region "$ACM_REGION" \
      --query 'Certificate.DomainValidationOptions[*].ResourceRecord' \
      --output table) || die_with_aws_error "Unable to read ACM validation records for $CERT_ARN." "$records_output"
    echo "$records_output"
    SUMMARY_CERT_WAITED="no"
    print_pending_validation_next_steps
    exit 0
  fi
  SUMMARY_CERT_WAITED="yes"
  echo "Waiting for certificate to be issued (may take several minutes)..."
  local wait_output=""
  wait_output=$(aws_capture aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region "$ACM_REGION") || {
    die_with_aws_error "Timed out or failed while waiting for ACM certificate validation." "$wait_output"
  }
  echo "Certificate issued."
}
ensure_cert_issued

# Resolve CloudFront distribution (reuse existing or create)
get_or_create_distribution() {
  if [[ -n "${DIST_ID:-}" ]]; then
    SUMMARY_DIST="provided (DIST_ID)"
    echo "Using CloudFront distribution from DIST_ID: $DIST_ID"
    ensure_redirect_distribution_origin "$DIST_ID"
    if include_www && ! distribution_covers_www "$DIST_ID"; then
      die_with_aws_error "CloudFront distribution $DIST_ID does not include alias www.${DOMAIN}, but www redirects are enabled by default." "Add the www alias to that distribution, or set INCLUDE_WWW=0 before rerunning."
    fi
    load_distribution_domain "$DIST_ID"
    echo "  domain: $DIST_DOMAIN"
    return
  fi

  local existing_id=""
  local list_output=""
  local list_status=0
  list_output=$(aws_capture aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Aliases.Items || \`[]\`, \`${DOMAIN}\`)].Id" \
    --output text) || list_status=$?

  if [[ "$list_status" -eq 0 ]]; then
    existing_id=$(printf '%s\n' "$list_output" | head -1 | tr -d '\r')
  elif is_access_denied "$list_output"; then
    echo "Warning: Missing cloudfront:ListDistributions. Skipping distribution reuse lookup; set DIST_ID to reuse a known distribution." >&2
  else
    die_with_aws_error "Unable to list CloudFront distributions." "$list_output"
  fi

  if ! is_blank_or_none "$existing_id"; then
    SUMMARY_DIST="reused"
    echo "Using existing CloudFront distribution: $existing_id"
    ensure_redirect_distribution_origin "$existing_id"
    if include_www && ! distribution_covers_www "$existing_id"; then
      die_with_aws_error "CloudFront distribution $existing_id already serves $DOMAIN but does not include alias www.${DOMAIN}, while www redirects are enabled by default." "Update that distribution to include the www alias, or set INCLUDE_WWW=0 before rerunning this script."
    fi
    load_distribution_domain "$existing_id"
    echo "  domain: $DIST_DOMAIN"
    return
  fi
  SUMMARY_DIST="created"
  local alias_count=1 alias_items="\"$DOMAIN\""
  if include_www; then
    alias_count=2
    alias_items="\"$DOMAIN\", \"www.$DOMAIN\""
  fi
  local caller_ref="win3bitcoin-redirect-$(date +%s)"
  local dist_config
  dist_config=$(cat <<DISTEOF
{
  "CallerReference": "$caller_ref",
  "Comment": "Redirect win3bitcoin.com to https://win3bitco.in",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3Website",
      "DomainName": "$S3_WEBSITE_ORIGIN",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Website",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "$CACHE_POLICY_ID",
    "Compress": true
  },
  "Aliases": { "Quantity": $alias_count, "Items": [$alias_items] },
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
DISTEOF
)
  echo "Creating CloudFront distribution..."
  local create_output=""
  local create_status=0
  create_output=$(aws_capture aws cloudfront create-distribution \
    --distribution-config "$dist_config" \
    --query 'Distribution.[Id,DomainName]' \
    --output text) || create_status=$?

  if [[ "$create_status" -ne 0 ]]; then
    die_with_aws_error "Unable to create CloudFront distribution. If the alias already exists, set DIST_ID to reuse it or grant cloudfront:ListDistributions so the script can detect it." "$create_output"
  fi

  DIST_ID="$(printf '%s\n' "$create_output" | awk '{print $1}')"
  DIST_DOMAIN="$(printf '%s\n' "$create_output" | awk '{print $2}')"
  echo "Created distribution: $DIST_ID (domain: $DIST_DOMAIN)"
}
get_or_create_distribution

# DNS: create Route 53 A records or print manual instructions
if [[ -z "${R53_HOSTED_ZONE_ID:-}" ]]; then
  SUMMARY_DNS="manual_instructions"
  echo "To enable HTTPS on $DOMAIN, point DNS to CloudFront:"
  echo "  CNAME $DOMAIN -> $DIST_DOMAIN"
  include_www && echo "  CNAME www.$DOMAIN -> $DIST_DOMAIN"
else
  SUMMARY_R53_RECORDS="$DOMAIN"
  include_www && SUMMARY_R53_RECORDS="$DOMAIN, www.$DOMAIN"
  SUMMARY_DNS="r53_upserted"
  echo "Creating Route 53 A (alias) records to CloudFront..."
  A_BATCH="{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"${DOMAIN}.\",\"Type\":\"A\",\"AliasTarget\":{\"HostedZoneId\":\"$CLOUDFRONT_HOSTED_ZONE_ID\",\"DNSName\":\"${DIST_DOMAIN}.\",\"EvaluateTargetHealth\":false}}}]}"
  change_route53_record_set "CloudFront alias record for $DOMAIN" "$A_BATCH"
  echo "  A record: $DOMAIN -> $DIST_DOMAIN"
  if include_www; then
    WWW_BATCH="{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"www.${DOMAIN}.\",\"Type\":\"A\",\"AliasTarget\":{\"HostedZoneId\":\"$CLOUDFRONT_HOSTED_ZONE_ID\",\"DNSName\":\"${DIST_DOMAIN}.\",\"EvaluateTargetHealth\":false}}}]}"
    change_route53_record_set "CloudFront alias record for www.$DOMAIN" "$WWW_BATCH"
    echo "  A record: www.$DOMAIN -> $DIST_DOMAIN"
  fi
fi

print_summary() {
  local validation_detail="$SUMMARY_VALIDATION"
  if [[ "$SUMMARY_VALIDATION" == "cnames_upserted" ]]; then
    validation_detail="CNAMEs upserted in R53 ($SUMMARY_VALIDATION_COUNT record(s))"
  elif [[ "$SUMMARY_VALIDATION" == "cnames_printed" ]]; then
    validation_detail="CNAMEs printed (add manually to DNS; or set R53_HOSTED_ZONE_ID)"
  elif [[ "$SUMMARY_VALIDATION" == "skipped (already issued)" ]]; then
    validation_detail="Skipped (certificate already issued)"
  fi
  echo ""
  echo "=============================================="
  echo "  CLOUDFRONT REDIRECT — SUMMARY REPORT"
  echo "=============================================="
  echo "  Domain:              $DOMAIN"
  echo "  Redirect target:     https://win3bitco.in"
  echo "  Include www:         $(include_www && echo 'yes' || echo 'no')"
  echo "  Region (S3):         $REGION"
  echo "  ACM region:          $ACM_REGION"
  echo "----------------------------------------------"
  echo "  ACM certificate:     $SUMMARY_CERT"
  echo "  Cert validation:     $validation_detail"
  echo "  Waited for issuance: $SUMMARY_CERT_WAITED"
  echo "  CloudFront dist:     $SUMMARY_DIST (id: $DIST_ID, domain: $DIST_DOMAIN)"
  echo "  DNS:                 $SUMMARY_DNS"
  if [[ -n "${SUMMARY_R53_RECORDS:-}" ]]; then
    echo "  R53 A records:       $SUMMARY_R53_RECORDS -> $DIST_DOMAIN"
  fi
  if [[ "$SUMMARY_DNS" == "manual_instructions" ]]; then
    echo "  Manual step:         Add CNAME(s) above to your DNS provider"
  fi
  echo "----------------------------------------------"
  echo "  Certificate ARN:     $CERT_ARN"
  echo "  Next:                CloudFront may take 5-15 min to deploy."
  echo "                       Then https://$DOMAIN -> https://win3bitco.in"
  echo "=============================================="
}

print_summary
