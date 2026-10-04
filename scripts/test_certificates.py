"""Regression checks for certificate recovery; no live AWS writes."""

import copy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import certificates


class CertificateRecoveryTests(unittest.TestCase):
    def test_checks_validation_for_domains_outside_distribution_aliases(self):
        # Arrange
        cert = {"DomainValidationOptions": [
            {"DomainName": name, "ValidationMethod": "DNS", "ResourceRecord": {
                "Name": "_token." + name + ".", "Type": "CNAME", "Value": "_value.acm-validations.aws.",
            }} for name in ("win3bitco.in", "www.win3bitco.in", "win3bitcoin.com", "www.win3bitcoin.com")
        ]}

        # Act
        records = certificates.validation_records(cert)

        # Assert
        self.assertEqual(len(records), 4)
        self.assertIn("_token.www.win3bitcoin.com.", [record["Name"] for record in records])

    def test_deduplicates_wildcard_validation_records(self):
        # Arrange
        option = {"ValidationMethod": "DNS", "ResourceRecord": {
            "Name": "_token.example.com.", "Type": "CNAME", "Value": "_value.acm-validations.aws.",
        }}
        cert = {"DomainValidationOptions": [option, copy.deepcopy(option)]}

        # Act
        records = certificates.validation_records(cert)

        # Assert
        self.assertEqual(len(records), 1)

    def test_check_fails_for_missing_validation_on_extra_san(self):
        # Arrange
        config = {"Aliases": {"Items": ["win3bitco.in"]}}
        cert = {"Type": "AMAZON_ISSUED", "Status": "ISSUED", "NotAfter": "2099-01-01T00:00:00Z",
                "RenewalEligibility": "ELIGIBLE", "DomainValidationOptions": [{
                    "DomainName": "win3bitcoin.com", "ValidationMethod": "DNS", "ResourceRecord": {
                        "Name": "_token.win3bitcoin.com.", "Type": "CNAME", "Value": "_value.acm-validations.aws.",
                    },
                }]}
        with tempfile.TemporaryDirectory() as directory, \
                patch.object(certificates, "inspect", return_value=(config, cert)), \
                patch.object(certificates, "dns_value", return_value=""), \
                patch.object(certificates.socket, "create_connection"), \
                patch.object(certificates.ssl, "create_default_context") as context:
            context.return_value.wrap_socket.return_value.__enter__.return_value.getpeercert.return_value = {
                "notAfter": "Jan 1 00:00:00 2099 GMT",
            }

            # Act
            success = certificates.check("test-distribution", Path(directory))

        # Assert
        self.assertFalse(success)

    def test_rejects_email_validation_for_automatic_renewal(self):
        # Arrange
        cert = {"DomainValidationOptions": [{"ValidationMethod": "EMAIL"}]}

        # Act / Assert
        with self.assertRaisesRegex(RuntimeError, "not DNS-validated"):
            certificates.validation_records(cert)

    def test_expired_certificate_cannot_be_reused(self):
        # Arrange
        cert = {"Type": "AMAZON_ISSUED", "Status": "EXPIRED", "NotAfter": "2026-09-26T23:59:59Z"}

        # Act
        usable = certificates.usable_certificate(cert)

        # Assert
        self.assertFalse(usable)

    def test_reuses_pending_certificate_after_interrupted_repair(self):
        # Arrange
        aliases = ["win3bitco.in", "www.win3bitco.in"]
        cert = {"CertificateArn": "pending-arn", "Type": "AMAZON_ISSUED", "Status": "PENDING_VALIDATION",
                "SubjectAlternativeNames": aliases, "DomainValidationOptions": [{"ValidationMethod": "DNS"}]}
        summaries = {"CertificateSummaryList": [{"DomainName": aliases[0], "CertificateArn": "pending-arn"}]}
        with patch.object(certificates, "aws", return_value=summaries) as aws, \
                patch.object(certificates, "describe_certificate", return_value=cert):

            # Act
            arn = certificates.replacement_certificate(aliases)

        # Assert
        self.assertEqual(arn, "pending-arn")
        self.assertEqual(aws.call_count, 1)

    def test_waits_for_initially_absent_validation_options(self):
        # Arrange
        cert = {"Status": "PENDING_VALIDATION"}

        # Act
        ready = certificates.validation_ready(cert)

        # Assert
        self.assertFalse(ready)


if __name__ == "__main__":
    unittest.main()
