import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { getEdgeSource } from './edge-routing';

type Query = Record<string, { value: string; multiValue?: { value: string }[] }>;
function route(mode: 'app' | 'redirect', host: string, uri: string, query: Query = {}) {
  const context = { event: { request: { headers: { host: { value: host } }, uri, querystring: query } } };
  return runInNewContext(`${getEdgeSource(mode)}\nhandler(event);`, context);
}

describe('CloudFront canonical routing', () => {
  it('redirects www before rewriting a deep link', () => {
    // Arrange
    const host = 'www.win3bitcoin.com';
    // Act
    const result = route('app', host, '/learn');
    // Assert
    expect(result.statusCode).toBe(301);
    expect(result.headers.location.value).toBe('https://win3bitcoin.com/learn');
    expect(result.headers['cache-control'].value).toBe('no-store');
  });

  it('rewrites canonical extensionless routes to the SPA', () => {
    // Arrange
    const host = 'win3bitcoin.com';
    // Act
    const result = route('app', host, '/learn/mining');
    // Assert
    expect(result.uri).toBe('/index.html');
  });

  it.each(['/', '/assets/app.js', '/build-info.json', '/robots.txt', '/sitemap.xml'])(
    'preserves canonical resource %s', (uri) => {
      // Arrange / Act
      const result = route('app', 'win3bitcoin.com', uri);
      // Assert
      expect(result.uri).toBe(uri);
    },
  );

  it.each(['win3bitco.in', 'www.win3bitco.in', 'winabitco.in', 'www.winabitco.in'])(
    'redirects %s to the fixed canonical host', (host) => {
      // Arrange / Act
      const result = route('redirect', host, '/learn');
      // Assert
      expect(result.statusCode).toBe(301);
      expect(result.headers.location.value).toBe('https://win3bitcoin.com/learn');
    },
  );

  it('preserves escaped paths and repeated query values without double encoding', () => {
    // Arrange
    const query = {
      'payout%2Daddress': { value: 'bc1%2Fabc%26def', multiValue: [{ value: 'bc1%2Fabc%26def' }, { value: 'second%20address' }] },
      autoStart: { value: 'true' },
      empty: { value: '' },
    };
    // Act
    const result = route('redirect', 'win3bitco.in', '/learn%2Fmining', query);
    // Assert
    expect(result.headers.location.value).toBe('https://win3bitcoin.com/learn%2Fmining?payout%2Daddress=bc1%2Fabc%26def&payout%2Daddress=second%20address&autoStart=true&empty=');
  });

  it('cannot use an untrusted Host header as a redirect destination', () => {
    // Arrange / Act
    const result = route('app', 'evil.example', '//evil.example/login');
    // Assert
    expect(new URL(result.headers.location.value).hostname).toBe('win3bitcoin.com');
  });
});
