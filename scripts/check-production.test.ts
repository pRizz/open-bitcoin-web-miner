import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkProduction } from './check-production';

const publishedCommit = 'a'.repeat(40);
const metadata = { commitSha: publishedCommit, deployHost: 'win3bitcoin.com' };
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('live deployment checks', () => {
  it('checks HTTPS without following redirects and validates provenance', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('<html/>'))
      .mockResolvedValueOnce(Response.json(metadata));
    vi.stubGlobal('fetch', fetchMock);
    // Act
    await checkProduction(publishedCommit, 1);
    // Assert
    expect(fetchMock.mock.calls[0][0]).toMatch(/^https:\/\/win3bitcoin\.com\//);
    expect(fetchMock.mock.calls[0][1].redirect).toBe('manual');
  });

  it('fails when the canonical homepage redirects', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 301 })));
    // Act / Assert
    await expect(checkProduction(publishedCommit, 1)).rejects.toThrow('301');
  });

  it('fails when live build provenance belongs to another commit', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('<html/>'))
      .mockResolvedValueOnce(Response.json({ ...metadata, commitSha: 'b'.repeat(40) })));
    // Act / Assert
    await expect(checkProduction(publishedCommit, 1)).rejects.toThrow('commitSha');
  });

  it('retries a propagating deployment within the configured bound', async () => {
    // Arrange
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response('<html/>')).mockResolvedValueOnce(Response.json(metadata));
    vi.stubGlobal('fetch', fetchMock);
    // Act
    const check = checkProduction(publishedCommit, 2);
    await vi.advanceTimersByTimeAsync(10000);
    await check;
    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
