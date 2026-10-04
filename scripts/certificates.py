#!/usr/bin/env python3
"""Check or repair CloudFront HTTPS using AWS CLI and permanent ACM DNS records."""

import argparse
import hashlib
import json
import logging
from pathlib import Path
import socket
import ssl
import subprocess
import sys
import time
from datetime import datetime, timezone


def aws(*args):
    """Run AWS CLI with bounded requests and propagate every failure."""
    result = subprocess.run(
        ["aws", *args, "--region", "us-east-1", "--output", "json",
         "--no-cli-pager", "--cli-connect-timeout", "10", "--cli-read-timeout", "30"],
        check=True, capture_output=True, text=True, timeout=60,
    )
    return json.loads(result.stdout)


def save_json(run_dir, name, value):
    target = run_dir / name
    target.write_text(json.dumps(value, indent=2) + "\n")
    return str(target)


def describe_certificate(arn):
    return aws("acm", "describe-certificate", "--certificate-arn", arn)["Certificate"]


def usable_certificate(cert, minimum_days=30):
    if cert["Type"] != "AMAZON_ISSUED" or cert["Status"] != "ISSUED":
        return False
    expiry = datetime.fromisoformat(cert["NotAfter"].replace("Z", "+00:00"))
    return (expiry - datetime.now(timezone.utc)).total_seconds() > minimum_days * 86400


def validation_records(cert):
    """Include every SAN's validation record, including names outside app aliases."""
    records = {}
    for option in cert["DomainValidationOptions"]:
        if option.get("ValidationMethod") != "DNS":
            raise RuntimeError("Certificate is not DNS-validated; request a DNS certificate.")
        maybe_record = option.get("ResourceRecord")
        if not maybe_record:
            raise RuntimeError("ACM has not populated all validation records; rerun shortly.")
        records[maybe_record["Name"]] = maybe_record
    if not records:
        raise RuntimeError("Certificate has no DNS validation records.")
    return list(records.values())


def dns_value(name):
    result = subprocess.run(
        ["dig", "+short", "+time=3", "+tries=1", "CNAME", name],
        check=True, capture_output=True, text=True, timeout=10,
    )
    return result.stdout.strip().lower()


def inspect(distribution_id, run_dir, stage="check"):
    response = aws("cloudfront", "get-distribution-config", "--id", distribution_id)
    save_json(run_dir, f"{distribution_id}-{stage}.json", response)
    config = response["DistributionConfig"]
    arn = config["ViewerCertificate"]["ACMCertificateArn"]
    cert = describe_certificate(arn)
    save_json(run_dir, f"{distribution_id}-certificate-{stage}.json", cert)
    logging.info("%s: certificate %s; status=%s; expires=%s; renewal=%s",
                 distribution_id, arn, cert["Status"], cert.get("NotAfter"),
                 cert.get("RenewalSummary", {}).get("RenewalStatus", "not started"))
    return config, cert


def check(distribution_id, run_dir):
    config, cert = inspect(distribution_id, run_dir)
    issues = []
    if not usable_certificate(cert):
        issues.append("certificate is expired, not issued, or expires within 30 days")
    if cert.get("RenewalEligibility") != "ELIGIBLE":
        issues.append("certificate is not eligible for managed renewal")
    try:
        for record in validation_records(cert):
            if dns_value(record["Name"]) != record["Value"].lower():
                issues.append(f"missing/incorrect public validation CNAME: {record['Name']}")
    except RuntimeError as error:
        issues.append(str(error))
    for host in config["Aliases"]["Items"]:
        try:
            with socket.create_connection((host, 443), timeout=10) as connection:
                with ssl.create_default_context().wrap_socket(connection, server_hostname=host) as tls:
                    logging.info("%s: verified TLS; expires=%s", host, tls.getpeercert()["notAfter"])
        except (OSError, ssl.SSLError) as error:
            issues.append(f"{host}: TLS verification failed: {error}")
    for issue in issues:
        logging.error("%s: %s", distribution_id, issue)
    return not issues


def ensure_dns(cert, run_dir):
    zones = [zone for zone in aws("route53", "list-hosted-zones")["HostedZones"]
             if not zone["Config"]["PrivateZone"]]
    batches = {}
    for record in validation_records(cert):
        matches = [zone for zone in zones
                   if record["Name"].lower().endswith("." + zone["Name"].lower())]
        if not matches:
            raise RuntimeError(f"No public Route 53 zone for {record['Name']}")
        zone = max(matches, key=lambda item: len(item["Name"]))
        if dns_value(record["Name"]) == record["Value"].lower():
            logging.info("Validation CNAME already correct: %s", record["Name"])
            continue
        batches.setdefault(zone["Id"], []).append({
            "Action": "UPSERT", "ResourceRecordSet": {
                "Name": record["Name"], "Type": "CNAME", "TTL": 300,
                "ResourceRecords": [{"Value": record["Value"]}],
            },
        })
    for zone_id, changes in batches.items():
        batch_file = save_json(run_dir, f"dns-{zone_id.split('/')[-1]}.json", {
            "Comment": "Permanent ACM validation records for automatic renewal",
            "Changes": changes,
        })
        result = aws("route53", "change-resource-record-sets", "--hosted-zone-id", zone_id,
                     "--change-batch", "file://" + batch_file)
        logging.info("Restored %s CNAMEs in %s; change=%s", len(changes), zone_id,
                     result["ChangeInfo"]["Id"])


def wait_for(description, probe, timeout):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if probe():
            logging.info("%s: ready", description)
            return
        logging.info("Waiting for %s", description)
        time.sleep(20)
    raise RuntimeError(f"Timed out waiting for {description}; rerun to resume.")


def replacement_certificate(aliases):
    # Reuse an exact match so interrupted recovery does not create extra certificates.
    summaries = aws("acm", "list-certificates", "--certificate-statuses",
                    "ISSUED", "PENDING_VALIDATION")["CertificateSummaryList"]
    pending = []
    for summary in summaries:
        if summary["DomainName"] not in aliases:
            continue
        cert = describe_certificate(summary["CertificateArn"])
        if set(cert["SubjectAlternativeNames"]) != set(aliases):
            continue
        if cert["Type"] != "AMAZON_ISSUED":
            continue
        if not all(item.get("ValidationMethod") == "DNS"
                   for item in cert.get("DomainValidationOptions", [])):
            continue
        if usable_certificate(cert):
            return cert["CertificateArn"]
        if cert["Status"] == "PENDING_VALIDATION":
            pending.append(cert["CertificateArn"])
    if pending:
        return pending[0]
    ordered = sorted(aliases, key=lambda name: (name.startswith("www."), name))
    token = hashlib.sha256("|".join(ordered).encode()).hexdigest()[:32]
    args = ["acm", "request-certificate", "--domain-name", ordered[0],
            "--validation-method", "DNS", "--idempotency-token", token]
    if len(ordered) > 1:
        args.extend(["--subject-alternative-names", *ordered[1:]])
    return aws(*args)["CertificateArn"]


def validation_ready(cert):
    """ACM may omit validation options briefly after accepting a request."""
    if cert["Status"] not in ("PENDING_VALIDATION", "ISSUED"):
        raise RuntimeError(f"Certificate request failed: {cert['Status']}")
    options = cert.get("DomainValidationOptions", [])
    return bool(options) and all(item.get("ResourceRecord") for item in options)


def repair(distribution_id, run_dir, timeout):
    config, current = inspect(distribution_id, run_dir, "before")
    aliases = config["Aliases"]["Items"]
    if usable_certificate(current):
        ensure_dns(current, run_dir)
        logging.info("Keeping existing valid certificate")
        wait_for("CloudFront deployment", lambda: aws("cloudfront", "get-distribution", "--id",
                 distribution_id)["Distribution"]["Status"] == "Deployed", timeout)
        return
    # Restore old records too: they can be shared with certificates on other services.
    if all(item.get("ValidationMethod") == "DNS" for item in current["DomainValidationOptions"]):
        ensure_dns(current, run_dir)
    arn = replacement_certificate(aliases)
    logging.info("Replacement certificate for %s: %s", aliases, arn)

    wait_for("ACM validation records", lambda: validation_ready(describe_certificate(arn)), timeout)
    ensure_dns(describe_certificate(arn), run_dir)
    wait_for("ACM issuance", lambda: describe_certificate(arn)["Status"] == "ISSUED", timeout)
    fresh = aws("cloudfront", "get-distribution-config", "--id", distribution_id)
    updated = fresh["DistributionConfig"]
    if set(updated["Aliases"]["Items"]) != set(aliases):
        raise RuntimeError("Distribution aliases changed during recovery; rerun before updating.")
    save_json(run_dir, f"{distribution_id}-rollback.json", fresh)
    if updated["ViewerCertificate"]["ACMCertificateArn"] != arn:
        viewer = updated["ViewerCertificate"]
        viewer["ACMCertificateArn"] = arn
        viewer.pop("Certificate", None)
        viewer.pop("CertificateSource", None)
        config_file = save_json(run_dir, f"{distribution_id}-update.json", updated)
        aws("cloudfront", "update-distribution", "--id", distribution_id,
            "--if-match", fresh["ETag"], "--distribution-config", "file://" + config_file)
        logging.info("Updated only CloudFront viewer certificate for %s", distribution_id)
    wait_for("CloudFront deployment", lambda: aws("cloudfront", "get-distribution", "--id",
             distribution_id)["Distribution"]["Status"] == "Deployed", timeout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--distribution-id", required=True)
    parser.add_argument("--apply", action="store_true", help="Repair DNS and replace expired certificates")
    parser.add_argument("--timeout", type=int, default=900, help="Seconds per readiness stage")
    args = parser.parse_args()
    run_dir = Path(__file__).resolve().parents[1] / ".codex" / "certificates" / datetime.now(
        timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    run_dir.mkdir(parents=True)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(run_dir / "run.log")])
    logging.info("Mode=%s; snapshots/logs=%s", "repair" if args.apply else "read-only check", run_dir)
    success = False
    try:
        if args.apply:
            repair(args.distribution_id, run_dir, args.timeout)
            config = aws("cloudfront", "get-distribution-config", "--id", args.distribution_id)
            cert = describe_certificate(config["DistributionConfig"]["ViewerCertificate"]["ACMCertificateArn"])
            records = validation_records(cert)
            wait_for("public ACM validation CNAMEs", lambda: all(
                dns_value(record["Name"]) == record["Value"].lower() for record in records), args.timeout)
        success = check(args.distribution_id, run_dir)
    except (RuntimeError, KeyError, ValueError, OSError, subprocess.SubprocessError) as error:
        logging.error("Failed: %s", error)
        if isinstance(error, subprocess.CalledProcessError):
            logging.error("CLI error: %s", error.stderr.strip())
    save_json(run_dir, "summary.json", {"distributionId": args.distribution_id,
                                       "mode": "repair" if args.apply else "check", "success": success})
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
