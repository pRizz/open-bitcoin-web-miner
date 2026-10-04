# Win3Bitcoin.com

<!-- bright-builds-rules-readme-badges:begin -->

<!-- Managed upstream by bright-builds-rules. If this badge block needs a fix, open an upstream PR or issue instead of editing the downstream managed block. Keep repo-local README content outside this managed badge block. -->

[![GitHub Stars](https://img.shields.io/github/stars/pRizz/open-bitcoin-web-miner)](https://github.com/pRizz/open-bitcoin-web-miner)
[![TypeScript 5.8.2](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18.3.1](https://img.shields.io/badge/React-18.3.1-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![Vite 5.4.1](https://img.shields.io/badge/Vite-5.4.1-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Bright Builds: Rules](https://raw.githubusercontent.com/bright-builds-llc/bright-builds-rules/main/public/badges/bright-builds-rules-flat.svg)](https://github.com/bright-builds-llc/bright-builds-rules)
[![OpenLinks profile](https://img.shields.io/badge/OpenLinks-profile-0F172A)](https://openlinks.us/)

<!-- bright-builds-rules-readme-badges:end -->

## Common Commands

```sh
bun run verify
bun run dev
```

## Project info

**URL**: https://lovable.dev/projects/d92f5bad-8918-4827-a7b9-d4b9e8b466e9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d92f5bad-8918-4827-a7b9-d4b9e8b466e9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

Install [Bun](https://bun.sh/) 1.3.x before working locally. The repo pins `bun@1.3.9`, and the root install also covers the nested `external/` workspace package.

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
bun install

# Step 3a: Husky installs the pre-commit hook automatically during bun install.

# Step 4: Start the development server with auto-reloading and an instant preview.
bun run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Run `bun run verify` before opening a PR or pushing if you want the same typecheck/lint/test/build gate that CI and the Husky pre-commit hook enforce.

Local development uses HTTPS only when the ignored local cert files are present. On machines without those files, Vite falls back to HTTP automatically, while deploy builds still upload Sentry source maps when `SENTRY_AUTH_TOKEN` is available through the deploy flow.

If you previously used the old custom `.githooks` path and Husky does not trigger, run `git config --unset core.hooksPath` once and then `bun run prepare`.

Production deploys run automatically on pushes to `main` via [deploy-production.yml](.github/workflows/deploy-production.yml).

The canonical production URL is [https://win3bitcoin.com](https://win3bitcoin.com). The deploy bucket name `www.winabitco.in` is an infrastructure detail, not the canonical URL for verifying what is live.

Production only reflects commits that exist on GitHub `main`. Local-only commits, detached worktrees, and unpublished SHAs are not eligible for production deploys.

To verify what is live in production, check the footer on `https://win3bitcoin.com` or inspect [https://win3bitcoin.com/build-info.json](https://win3bitcoin.com/build-info.json).

The workflow uses the GitHub `production` environment and expects:

- Variable `AWS_REGION=us-east-2`
- Variable `S3_BUCKET=www.winabitco.in`
- Variable `CLOUDFRONT_DISTRIBUTION_ID=E3GD8ZGWCJI0MH`
- Variable `AWS_DEPLOY_ROLE_ARN=<oidc-assumable-role-arn>`
- Secret `SENTRY_AUTH_TOKEN=<production sentry token>`

For local manual deploys, use:

```sh
./scripts/build-and-deploy-to-s3.sh
```

Or, if the build already exists and you only want the deploy step:

```sh
bun run deploy
```

The shared production configuration in `src/config/production.ts` supplies canonical identity and deployment defaults. Explicit environment values must match it. A deploy rejects dirty or untracked source, unpublished commits, a stale bundle, or a bundle built for a different hostname before changing S3; after upload it waits for CloudFront invalidation and verifies HTTPS, the homepage, and the exact deployed commit. For a read-only live check:

```sh
bun run deploy:check <published-main-sha>
```

The existing private app bucket remains `www.winabitco.in` in `us-east-2`. Distribution `E3GD8ZGWCJI0MH` serves the app at `.com`; `www.win3bitcoin.com` redirects to the apex. Distribution `EVH2SH6YOOO76` redirects `win3bitco.in`, `www.win3bitco.in`, `winabitco.in`, and `www.winabitco.in` to `.com`, retaining paths and query parameters. Backend endpoints such as `backend.win3bitco.in` are unchanged.

Read-only domain checks and explicit maintenance phases use the separate maintenance identity:

```sh
bun run domains:check
bun scripts/configure-domains.ts --phase prepare        # preview changes
bun scripts/configure-domains.ts --phase prepare --apply
bun scripts/configure-domains.ts --phase cutover        # preview redirects
bun scripts/configure-domains.ts --phase cutover --apply
```

See [canonical hosting and redirect operations](docs/s3-redirect-setup.md) for staged rollout, external service updates, and rollback. The old S3 redirect commands fail before writes to prevent accidentally restoring the old direction. Domain maintenance snapshots and logs remain ignored under `.codex/`.

### Production TLS certificates

CloudFront certificates live in ACM **us-east-1**, independently of the S3 deploy region. The `.com` app (`E3GD8ZGWCJI0MH`) and legacy-domain redirects (`EVH2SH6YOOO76`) use separate DNS-validated certificates. Keep every ACM validation CNAME permanently in its public Route 53 zone: removing even one record can prevent renewal of the entire certificate, including its other domains.

AWS [automatically renews DNS-validated certificates](https://docs.aws.amazon.com/acm/latest/userguide/dns-renewal-validation.html) while they are attached to CloudFront and all validation records remain publicly accessible. CloudFront uses the renewed certificate automatically; no application deployment, scheduled certificate requests, or cache invalidation is needed.

With AWS CLI v2, Python 3.9+, and `dig` installed, check certificate status, renewal eligibility, all public validation CNAMEs, and live TLS verification:

```sh
python3 scripts/certificates.py --distribution-id EVH2SH6YOOO76
python3 scripts/certificates.py --distribution-id E3GD8ZGWCJI0MH
```

The default is read-only and exits nonzero when unhealthy or within 30 days of expiry. To restore missing CNAMEs and replace an expired certificate:

```sh
python3 scripts/certificates.py --distribution-id EVH2SH6YOOO76 --apply
python3 scripts/certificates.py --distribution-id E3GD8ZGWCJI0MH --apply
```

Repair reuses issued or pending certificates matching the distribution aliases, waits for issuance, and updates only the viewer certificate using CloudFront's ETag concurrency check. It saves configuration snapshots, rollback input, logs, and a result summary under the ignored `.codex/certificates/` directory. After an interrupted run, rerun the same command. Repair waits for public DNS propagation; DNS caching may briefly delay a successful read-only check after restoring records.

Use `AWS_PROFILE` for a different CLI identity. Checks require `cloudfront:GetDistributionConfig` and `acm:DescribeCertificate`. Repairs additionally require `cloudfront:GetDistribution`, `cloudfront:UpdateDistribution`, `acm:ListCertificates`, `acm:RequestCertificate`, `route53:ListHostedZones`, and `route53:ChangeResourceRecordSets` for the affected public zones. The application deploy role does not need these maintenance permissions.

Regression checks for the maintenance tool:

```sh
python3 -m unittest discover -s scripts -p 'test_certificates.py' -v
```
