import { productionSite } from '../config/production';
import { getPageTitle } from '../routes';
import { canonicalUrl } from './siteUrls';

/** Derive route metadata independently of the current browser origin. */
export function pageMetadata(pathname: string): { title: string; url: string } {
  const pageTitle = getPageTitle(new URL(pathname, productionSite.origin).pathname);
  return {
    title: pageTitle === productionSite.brand
      ? productionSite.brand
      : `${pageTitle} | ${productionSite.brand}`,
    url: canonicalUrl(pathname),
  };
}
