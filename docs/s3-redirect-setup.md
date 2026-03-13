# S3 redirect: win3bitcoin.com → https://win3bitco.in

This document describes the one-time setup for the S3 bucket that redirects all requests from **win3bitcoin.com** to **https://win3bitco.in**. No app build artifacts are uploaded to this bucket; it uses S3 static website hosting with a redirect-only configuration.

## Overview

- **Redirect bucket**: `win3bitcoin.com` (S3 bucket name must match the domain for website hosting)
- **Redirect target**: `https://win3bitco.in`
- **App deploy**: Unchanged; the main app is still built and synced only to `s3://www.winabitco.in/`. This bucket is configured once and never receives app assets.

## One-time setup

### 1. Create the bucket

Use the same region as your main app bucket (e.g. `www.winabitco.in`) for consistency:

```bash
aws s3api create-bucket --bucket win3bitcoin.com --region us-east-1
```

For regions other than `us-east-1`, add:

```bash
aws s3api put-bucket-location-constraint --bucket win3bitcoin.com --location-constraint us-east-1
```

(Replace `us-east-1` with your region; `us-east-1` does not use `LocationConstraint`.)

### 2. Enable static website redirect

Configure the bucket to redirect all requests to the target host. No index document or file uploads are required.

**Via AWS CLI:**

```bash
aws s3api put-bucket-website --bucket win3bitcoin.com --website-configuration '{
  "RedirectAllRequestsTo": {
    "HostName": "win3bitco.in",
    "Protocol": "https"
  }
}'
```

**Via AWS Console:**

1. Open S3 → bucket **win3bitcoin.com** → **Properties**.
2. Under **Static website hosting**, click **Edit**.
3. Choose **Redirect all requests to an object**.
4. **Host name**: `win3bitco.in`
5. **Protocol**: `https`
6. Save.

### 3. DNS

Point **win3bitcoin.com** (and optionally **www.win3bitcoin.com**) to the S3 website endpoint so traffic reaches the redirect.

**S3 website endpoint (HTTP only):**

- Format: `win3bitcoin.com.s3-website-<region>.amazonaws.com`
- Example (us-east-1): `win3bitcoin.com.s3-website-us-east-1.amazonaws.com`

**Route 53:**

- Create an **A** record (alias) or **CNAME** for `win3bitcoin.com` pointing to the S3 website endpoint above.
- For `www.win3bitcoin.com`, either create another alias/CNAME to the same endpoint or a CNAME to `win3bitcoin.com` if your DNS provider supports it.

**Note:** S3 website endpoints serve **HTTP only**. So `http://win3bitcoin.com` will redirect to `https://win3bitco.in`. Users who type `https://win3bitcoin.com` will need HTTPS on that hostname, which requires CloudFront (see below).

### 4. HTTPS on win3bitcoin.com (optional)

To have `https://win3bitcoin.com` redirect to `https://win3bitco.in` (recommended for SEO and trust):

1. **Request an ACM certificate** (in **us-east-1** for CloudFront) for `win3bitcoin.com` (and `www.win3bitcoin.com` if desired). Validate via DNS.
2. **Create a CloudFront distribution:**
   - **Origin domain**: S3 website endpoint for `win3bitcoin.com`, e.g. `win3bitcoin.com.s3-website-us-east-1.amazonaws.com` (do **not** choose the REST-style S3 bucket endpoint).
   - **Alternate domain names (CNAMEs)**: `win3bitcoin.com` (and optionally `www.win3bitcoin.com`).
   - **Custom SSL certificate**: Select the ACM certificate from step 1.
   - **Default root object**: Leave blank (redirect is handled by S3).
3. **DNS**: Point `win3bitcoin.com` (and `www.win3bitcoin.com` if used) to the CloudFront distribution (CNAME or Route 53 alias to the `*.cloudfront.net` domain).

After DNS propagates, both `http://win3bitcoin.com` and `https://win3bitcoin.com` will redirect to `https://win3bitco.in`.

### Redirect script bundle

The redirect automation is grouped under `./scripts/redirect/`:

- `bucket.sh` – S3 redirect bucket setup
- `cloudfront.sh` – ACM + CloudFront setup
- `dns.sh` – Route 53 alias records to CloudFront

The easiest entrypoint is the orchestrator:

```bash
./scripts/setup-redirect.sh help
```

#### Automated CloudFront + HTTPS setup

You can automate steps 1–3 with the script below. It requests the ACM certificate, (optionally) adds validation CNAMEs in Route 53, creates the CloudFront distribution, and (optionally) creates A (alias) records to CloudFront.

**Prerequisites:** S3 redirect bucket already set up (`./scripts/redirect/bucket.sh` or `./scripts/setup-redirect.sh bucket`). AWS CLI configured with permissions for ACM, CloudFront, and (if using Route 53) Route 53.

**Optional environment variables:**

- **`R53_HOSTED_ZONE_ID`** – Route 53 hosted zone ID for `win3bitcoin.com`. If set, the script adds ACM validation CNAMEs and A records to CloudFront automatically. If unset, it prints the CNAMEs and CloudFront domain for you to add in your DNS provider.
- **`INCLUDE_WWW`** – Included by default. Set to `0` to skip `www.win3bitcoin.com` in the certificate and CloudFront aliases.

**Run:**

```bash
# Run the bundled bucket + CloudFront + DNS flow
./scripts/setup-redirect.sh all

# With Route 53 (full automation: cert validation + DNS to CloudFront)
export R53_HOSTED_ZONE_ID=Z1234567890ABC
./scripts/setup-redirect.sh cloudfront

# Optional: disable www.win3bitcoin.com
export R53_HOSTED_ZONE_ID=Z1234567890ABC
export INCLUDE_WWW=0
./scripts/setup-redirect.sh cloudfront

# Without Route 53 (script creates cert + CloudFront; you add CNAMEs manually)
./scripts/setup-redirect.sh cloudfront
```

If ACM validation is still pending and no CloudFront distribution is available yet, the orchestrator skips the DNS step and tells you to rerun `./scripts/setup-redirect.sh dns` after validation is complete.

The script is idempotent: it reuses an existing issued ACM certificate for the domain (if present), reuses an existing CloudFront distribution that already has the alias, and uses Route 53 UPSERT for validation CNAMEs and A records. Safe to run multiple times.

#### Route 53 DNS only (final step)

If the CloudFront distribution already exists and you only want to automate the last DNS step in Route 53, use:

```bash
./scripts/setup-redirect.sh dns
```

Behavior:

- Auto-detects the public Route 53 hosted zone for `win3bitcoin.com` when possible
- Auto-detects the CloudFront distribution that already serves `win3bitcoin.com` when possible
- UPSERTs Route 53 alias **A** records to the CloudFront distribution

Optional environment variables:

- **`R53_HOSTED_ZONE_ID`** – Explicit hosted zone ID if auto-detection is not desired
- **`DIST_ID`** – Explicit CloudFront distribution ID if alias-based discovery is not available
- **`DIST_DOMAIN`** – Explicit CloudFront domain name if you want to skip CloudFront lookups entirely
- **`INCLUDE_WWW`** – Included by default. Set to `0` to skip `www.win3bitcoin.com` when aliases cannot be discovered automatically
- **`DRY_RUN`** – Set to `1` to print the intended Route 53 change batch without applying it

Examples:

```bash
# Preview the Route 53 changes without applying them
DRY_RUN=1 ./scripts/setup-redirect.sh dns

# Apply the final Route 53 alias records
./scripts/setup-redirect.sh dns

# Apply using an explicit hosted zone ID and known distribution ID
R53_HOSTED_ZONE_ID=Z1234567890ABC DIST_ID=E1234567890ABC ./scripts/setup-redirect.sh dns
```

## Reproducible setup scripts

**1. S3 redirect bucket only (HTTP redirect):**

```bash
./scripts/setup-redirect.sh bucket
```

Ensure the AWS CLI is installed and configured (credentials or profile) with permission to create buckets and put bucket website configuration.

**2. CloudFront + HTTPS (optional, after step 1):**

See [Automated CloudFront + HTTPS setup](#automated-cloudfront--https-setup) above for `./scripts/setup-redirect.sh cloudfront` usage.

**3. Route 53 DNS only (optional, after CloudFront exists):**

Use `./scripts/setup-redirect.sh dns` to automate just the final Route 53 alias step.
