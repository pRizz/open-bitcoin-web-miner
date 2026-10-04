import { describe, expect, it } from 'vitest';
import { productionSite } from '../config/production';
import { routes } from '../routes';
import { canonicalUrl, miningShareUrl, robotsTxt, sitemapXml } from './siteUrls';
import { pageMetadata } from './pageMetadata';

describe('production sharing', () => {
  it('preserves deep paths, fragments, and repeated escaped query values on the canonical origin', () => {
    // Arrange
    const source = 'https://www.win3bitco.in:8443/submission/ab%2Fcd?tag=a%26b&tag=c%2Bd#details';
    // Act
    const result = new URL(miningShareUrl(source, { includeAutoStart: false, includeAddress: false }));
    // Assert
    expect(result.origin).toBe(productionSite.origin);
    expect(result.pathname).toBe('/submission/ab%2Fcd');
    expect(result.searchParams.getAll('tag')).toEqual(['a&b', 'c+d']);
    expect(result.hash).toBe('#details');
  });

  it('includes the selected mining options', () => {
    // Arrange
    const options = { includeAutoStart: true, includeAddress: true, maybeMinerAddress: 'bc1example' };
    // Act
    const result = new URL(miningShareUrl('http://localhost:8085/simple-mining?theme=dark', options));
    // Assert
    expect(result.searchParams.get('startMiningImmediately')).toBe('true');
    expect(result.searchParams.get('prefilledBitcoinAddress')).toBe('bc1example');
    expect(result.searchParams.get('theme')).toBe('dark');
  });

  it('removes pre-existing mining options when sharing options are disabled', () => {
    // Arrange
    const source = '/?startMiningImmediately=true&prefilledBitcoinAddress=old&prefilledBitcoinAddress=older';
    // Act
    const result = miningShareUrl(source, { includeAutoStart: false, includeAddress: false });
    // Assert
    expect(result).toBe(`${productionSite.origin}/`);
  });

  it('omits the address when no miner address is available', () => {
    // Arrange
    const options = { includeAutoStart: false, includeAddress: true };
    // Act
    const result = miningShareUrl('/?prefilledBitcoinAddress=stale', options);
    // Assert
    expect(result).toBe(`${productionSite.origin}/`);
  });
});

describe('route metadata', () => {
  it('canonicalizes the current path and strips query parameters and fragments', () => {
    // Arrange
    const source = 'https://winabitco.in/hash-details/abc?prefilledBitcoinAddress=private#details';
    // Act
    const result = canonicalUrl(source);
    // Assert
    expect(result).toBe(`${productionSite.origin}/hash-details/abc`);
  });

  it.each([
    ['/', productionSite.brand],
    ['/about?utm_source=test', `About | ${productionSite.brand}`],
    ['/submission/abc', `Submission | ${productionSite.brand}`],
    ['/hash-details/abc', `Hash Details | ${productionSite.brand}`],
  ])('uses the correct page title for %s', (routePath, expectedTitle) => {
    // Arrange / Act
    const result = pageMetadata(routePath);
    // Assert
    expect(result.title).toBe(expectedTitle);
  });

  it('does not assign the homepage canonical to a deep route', () => {
    // Arrange / Act
    const result = pageMetadata('/mining-statistics?network=mainnet');
    // Assert
    expect(result.url).toBe(`${productionSite.origin}/mining-statistics`);
  });
});

describe('search discovery', () => {
  it('includes exactly the public static application routes', () => {
    // Arrange
    const publicPaths = Object.values(routes)
      .filter((route) => route.type === 'static' && route.keyName !== 'notifications')
      .map((route) => route.routerPath);
    // Act
    const result = sitemapXml();
    // Assert
    const locations = [...result.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual(publicPaths.map(canonicalUrl));
  });

  it('points robots to the production sitemap and excludes notifications', () => {
    // Arrange / Act
    const result = robotsTxt();
    // Assert
    expect(result).toContain(`Sitemap: ${productionSite.origin}/sitemap.xml`);
    expect(result).toContain('Disallow: /notifications');
  });
});
