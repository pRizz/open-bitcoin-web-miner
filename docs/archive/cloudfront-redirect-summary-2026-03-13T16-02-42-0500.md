# CloudFront Redirect Setup Summary

Archived at: 2026-03-13T16-02-42-0500

## Outcome

The CloudFront redirect setup completed successfully after IAM permissions were updated.

## Reused Resources

- ACM certificate ARN: `[redacted for public repo]`
- CloudFront distribution ID: `[redacted for public repo]`
- CloudFront domain: `[redacted for public repo]`

## Configuration Summary

- Domain: `win3bitcoin.com`
- Redirect target: `https://win3bitco.in`
- Include `www`: `no`
- S3 region: `us-east-1`
- ACM region: `us-east-1`
- ACM certificate status: reused existing issued certificate
- Certificate validation: skipped because the certificate was already issued
- CloudFront distribution status: reused existing distribution
- DNS mode: manual instructions

## Remaining Manual Step

Point `win3bitcoin.com` to the provisioned CloudFront distribution domain.

If your DNS provider does not support apex `CNAME`, use its equivalent `ALIAS`, `ANAME`, or flattening record.

Retrieve the current CloudFront target from AWS if needed:

```bash
aws cloudfront get-distribution --id <distribution-id> --query 'Distribution.DomainName' --output text
```

## Notes

- CloudFront may take 5-15 minutes to deploy changes.
- Expected final behavior: `https://win3bitcoin.com` redirects to `https://win3bitco.in`.
