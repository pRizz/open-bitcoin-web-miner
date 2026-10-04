# Canonical hosting and redirects

[Win3Bitcoin.com](https://win3bitcoin.com) is the canonical website. This page replaces the previous S3 redirect setup; its filename is retained for existing documentation links.

## Resources and behavior

| Hostnames                          | Distribution     | Behavior           |
| ---------------------------------- | ---------------- | ------------------ |
| `win3bitcoin.com`                  | `E3GD8ZGWCJI0MH` | Serve the app      |
| `www.win3bitcoin.com`              | `E3GD8ZGWCJI0MH` | 301 to `.com` apex |
| `win3bitco.in`, `www.win3bitco.in` | `EVH2SH6YOOO76`  | 301 to `.com` apex |
| `winabitco.in`, `www.winabitco.in` | `EVH2SH6YOOO76`  | 301 to `.com` apex |

The app uses the existing private `www.winabitco.in` S3 bucket in `us-east-2` and its origin access control. Both CloudFront certificates are DNS validated in ACM `us-east-1`; keep all validation CNAMEs permanently. A and AAAA aliases point to the corresponding CloudFront distributions. Backend subdomains and parked domains are outside this migration.

CloudFront viewer-request functions preserve escaped paths and repeated query values. The `.com` function redirects noncanonical hosts before rewriting extensionless SPA routes to `/index.html`. Redirects use a fixed canonical destination and `Cache-Control: no-store` during migration to reduce browser-cached reverse loops. Existing cached old redirects may still require clearing browser data when testing.

## Maintenance commands

Use Bun 1.3.x and an authenticated AWS CLI identity with maintenance access to CloudFront, ACM, and the three public Route 53 zones. Routine GitHub app deployment credentials should have only app-bucket upload and app-distribution invalidation/read permissions.

```sh
# Read-only status by default
bun scripts/configure-domains.ts

# Preview each phase; no infrastructure changes without --apply
bun scripts/configure-domains.ts --phase prepare
bun scripts/configure-domains.ts --phase prepare --apply
bun scripts/configure-domains.ts --phase cutover
bun scripts/configure-domains.ts --phase cutover --apply
```

Configuration lives in `src/config/production.ts`; snapshots and maintenance logs live under ignored `.codex/`. Rerun an interrupted phase: certificates and validation records are reused, and CloudFront updates use ETags to reject concurrent changes. Do not check local AWS snapshots into the public repository.

`./scripts/setup-redirect.sh` forwards new CLI arguments to the domain tool. Legacy `bucket`, `cloudfront`, `dns`, and `all` subcommands, and direct scripts under `scripts/redirect/`, fail before AWS writes. The unused S3 redirect bucket is retained for rollback but is not on the serving path.

## Staged rollout

1. Ensure no production deployment is running. Save CloudFront configurations, DNS records, attached certificates, deploy-role policies, and GitHub production environment variables.
1. Run `prepare --apply`: issue/reuse the redirect certificate, preserve validation records, and prepare edge functions. Promote `.com` to the existing app origin while `.in` continues serving the app. Wait for CloudFront deployment and invalidate cached `.com` redirects.
1. Temporarily permit the deploy role to create and read invalidations on both distributions. Set the GitHub production environment's `CLOUDFRONT_DISTRIBUTION_ID` to `E3GD8ZGWCJI0MH`. Publish the matching repository changes to `main` and let CI deploy.
1. Verify `.com` homepage, deep links, assets, mining, backend API/WebSocket connectivity, desktop/mobile layout, share URLs, and build provenance. Then run `cutover --apply` to activate legacy-domain redirects and DNS aliases.
1. Verify all six HTTPS hosts and A/AAAA DNS records, paths, repeated/escaped parameters, and absence of redirect loops. Limit routine deploy invalidations to `.com` after success.

Local deployment uses shared defaults and rejects mismatched overrides. It requires a clean worktree (including untracked files), `HEAD` to equal GitHub's current `main` commit, and `dist/build-info.json` to match that commit and the canonical host. Upload completion is followed by invalidation completion and HTTPS/provenance checks:

```sh
bun run deploy:dryrun
bun run deploy
bun run deploy:check <published-main-sha>
```

GitHub deployment IAM must allow `cloudfront:CreateInvalidation` and `cloudfront:GetInvalidation` for `E3GD8ZGWCJI0MH`; the latter is required by the completion waiter.

## External services

Update GitHub's repository homepage and the existing Google Analytics web stream's default URL to `https://win3bitcoin.com`; preserve the measurement ID and Sentry project. Verify both sites in Google Search Console, submit `https://win3bitcoin.com/sitemap.xml`, and use Change of Address for the old domain when available. Keep legacy-domain redirects for at least one year. Browser storage on `.com` starts fresh; no settings-transfer feature is provided.

## Rollback

Retain both distributions, the old certificate, functions, and S3 resources. Use the saved CloudFront/DNS/IAM/GitHub snapshots as rollback inputs; fetch current ETags before applying a saved CloudFront configuration. First restore **both main domains to serving the app** so a cached redirect cannot create a loop. Verify both origins before optionally restoring the old redirect direction. Restore the GitHub distribution variable and invalidation permissions together with matching repository configuration and build metadata, then publish and verify the rollback deployment. Do not re-enable the retired S3 scripts.

## Certificate checks

The existing `scripts/certificates.py` remains supported. Check both attached certificates and renewal eligibility after maintenance:

```sh
python3 scripts/certificates.py --distribution-id E3GD8ZGWCJI0MH
python3 scripts/certificates.py --distribution-id EVH2SH6YOOO76
```

ACM renews attached DNS-validated certificates automatically while validation CNAMEs remain publicly accessible. CloudFront adopts the renewal without application deployment. See the [AWS renewal requirements](https://docs.aws.amazon.com/acm/latest/userguide/dns-renewal-validation.html).

## External dashboard follow-up

The migration retains Analytics measurement ID `G-88HYSQZDT7` and the existing Sentry project. Updating the Analytics web stream URL to `https://win3bitcoin.com` is a documented gap: the existing property was not available through the signed-in accounts, and its owner account is currently unknown. Do not create a replacement property or change the measurement ID to work around this.
