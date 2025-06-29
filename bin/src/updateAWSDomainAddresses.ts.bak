// update-domains.ts
import {
  Route53DomainsClient,
  ListDomainsCommand,
  type ListDomainsCommandOutput,
  UpdateDomainContactCommand,
  type ContactDetail,
} from "@aws-sdk/client-route-53-domains";

// Prerequisites:
// npm install --save-dev typescript ts-node
// npm install @aws-sdk/client-route-53-domains
// Run with
// AWS_REGION=us-east-1 pnpm run bin:dev

// ────────────────────────────────────────────────────────────
// ✅ 1. Hard-coded contact information – change these values!
// ────────────────────────────────────────────────────────────
const CONTACT: ContactDetail = {
  ContactType: "COMPANY",        // or "COMPANY" / "ASSOCIATION" …
  FirstName: "Peter",
  LastName: "Ryszkiewicz",
  AddressLine1: "3636 S Iron St",
  City: "Chicago",
  State: "IL",
  CountryCode: "US",
  ZipCode: "60609",
  PhoneNumber: "+1.7084079575",
  Email: "support@brightbuilds.us",
  OrganizationName: "Bright Builds LLC",
  // Add any optional fields you need (AddressLine2, Fax, OrganizationName, etc.)
};

// ────────────────────────────────────────────────────────────
// ⚙️ 2. Boilerplate – AWS client & helpers
// ────────────────────────────────────────────────────────────
const client = new Route53DomainsClient({}); // region & creds are taken from env/Shared Config

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ────────────────────────────────────────────────────────────
// 📜 3. Get **all** your domains (handles pagination)
// ────────────────────────────────────────────────────────────
async function listAllDomains(): Promise<string[]> {
  let nextToken: string | undefined;
  const domains: string[] = [];

  do {
    const cmd = new ListDomainsCommand({ Marker: nextToken });
    const resp: ListDomainsCommandOutput = await client.send(cmd);

    resp.Domains?.forEach((d) => d.DomainName && domains.push(d.DomainName));
    nextToken = resp.NextPageMarker;
  } while (nextToken);

  return domains;
}

// ────────────────────────────────────────────────────────────
// 🛠️ 4. Update one domain’s contact info
// ────────────────────────────────────────────────────────────
async function updateOne(domain: string): Promise<void> {
  console.log(`Updating contact for ${domain}...`);
  const cmd = new UpdateDomainContactCommand({
    DomainName: domain,
    RegistrantContact: CONTACT,
    AdminContact: CONTACT,
    TechContact: CONTACT,
    BillingContact: CONTACT,
  });

  await client.send(cmd);
  console.log(`✔ Updated contact for ${domain}`);
}

// ────────────────────────────────────────────────────────────
// 🚀 5. Main program – update each domain, 1 every 2 s
// ────────────────────────────────────────────────────────────
export async function updateAWSDomainAddressesMain(): Promise<void> {
  console.log("Updating AWS domain addresses...");
  try {
    const domains = await listAllDomains();

    if (!domains.length) {
      console.log("No domains found in this account.");
      return;
    }

    console.log(`Found ${domains.length} domains. Starting updates …`);
    console.log(domains);

    for (const domain of domains) {
      try {
        await updateOne(domain);
      } catch (err) {
        console.error(`⚠️  Failed to update ${domain}:`, err);
      }
      await sleep(6000); // 6 000 ms = 6 s
    }

    console.log("All done.");
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}
