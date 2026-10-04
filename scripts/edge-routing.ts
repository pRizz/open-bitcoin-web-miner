import { readFileSync } from 'node:fs';
import { productionSite } from '../src/config/production';

/** CloudFront runtime 2.0 source; handler stays a global function for AWS test-function. */
export function getEdgeSource(mode: 'app' | 'redirect'): string {
  const routing = readFileSync(new URL('./edge/routing.js', import.meta.url), 'utf8');
  const handler = readFileSync(new URL(`./edge/${mode}.js`, import.meta.url), 'utf8');
  return `var canonicalHost = ${JSON.stringify(productionSite.host)};\nvar canonicalOrigin = ${JSON.stringify(productionSite.origin)};\n${routing}\n${handler}`;
}
