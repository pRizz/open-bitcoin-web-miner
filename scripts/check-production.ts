import { fileURLToPath } from 'node:url';
import { productionSite } from '../src/config/production';
import { validateBuildMetadata } from './production-config';

export async function checkProduction(expectedCommit: string, attempts = 12) {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new Error('Production checks require TLS certificate validation.');
  if (!/^[a-f0-9]{40}$/.test(expectedCommit)) throw new Error('Expected a full published commit SHA.');
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const homepage = await fetch(`${productionSite.origin}/?deploy-check=${Date.now()}`, {
        redirect: 'manual', signal: AbortSignal.timeout(15000),
      });
      if (homepage.status !== 200) throw new Error(`Canonical homepage returned ${homepage.status}.`);
      const metadata = await fetch(`${productionSite.origin}/build-info.json?deploy-check=${Date.now()}`, {
        redirect: 'manual', signal: AbortSignal.timeout(15000),
      });
      if (metadata.status !== 200) throw new Error(`Build metadata returned ${metadata.status}.`);
      validateBuildMetadata(await metadata.json(), expectedCommit);
      console.log(`Verified HTTPS, homepage, and ${expectedCommit} at ${productionSite.origin}.`);
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.error(`Production check ${attempt}/${attempts}: ${String(error)}; retrying in 10s.`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await checkProduction(process.argv[2]);
}
