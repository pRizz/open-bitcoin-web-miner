import { productionSite } from '../config/production';
import { publicRoutePaths } from '../config/publicRoutes';
import { URL_PARAMS } from '../constants/mining';

type ShareOptions = {
  includeAutoStart: boolean;
  includeAddress: boolean;
  maybeMinerAddress?: string;
};

function productionUrl(locationUrl: string): URL {
  const source = new URL(locationUrl, productionSite.origin);
  const url = new URL(productionSite.origin);
  url.pathname = source.pathname;
  url.search = source.search;
  url.hash = source.hash;
  return url;
}

/** Canonical metadata identifies the current page without session parameters. */
export function canonicalUrl(locationUrl: string): string {
  const url = productionUrl(locationUrl);
  url.search = '';
  url.hash = '';
  return url.toString();
}

/** Shares always target production and honor the explicitly selected mining options. */
export function miningShareUrl(locationUrl: string, options: ShareOptions): string {
  const url = productionUrl(locationUrl);
  url.searchParams.delete(URL_PARAMS.AUTO_START);
  url.searchParams.delete(URL_PARAMS.BITCOIN_ADDRESS);

  if (options.includeAutoStart) {
    url.searchParams.set(URL_PARAMS.AUTO_START, 'true');
  }
  if (options.includeAddress && options.maybeMinerAddress) {
    url.searchParams.set(URL_PARAMS.BITCOIN_ADDRESS, options.maybeMinerAddress);
  }
  return url.toString();
}

/** Generate discovery files from the same public paths used by the router. */
export function sitemapXml(): string {
  const entries = Object.values(publicRoutePaths)
    .map((routePath) => `  <url><loc>${canonicalUrl(routePath)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\nDisallow: /notifications\n\nSitemap: ${productionSite.origin}/sitemap.xml\n`;
}
