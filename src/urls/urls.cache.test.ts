import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();

vi.mock('../redis/redis.ts', () => ({
  redisClient: { get: mockGet, set: mockSet, del: mockDel }
}));

const { getCachedUrl, setCachedUrl, invalidateUrlCache } = await import('./urls.cache.ts');

beforeEach(() => {
  mockGet.mockReset();
  mockSet.mockReset();
  mockDel.mockReset();
});

describe('getCachedUrl', () => {
  it('returns undefined on a cache miss', async () => {
    mockGet.mockResolvedValueOnce(null);

    expect(await getCachedUrl('abc')).toBeUndefined();
  });

  it('parses a cached payload back into original + expiresAt', async () => {
    mockGet.mockResolvedValueOnce(
      JSON.stringify({ original: 'https://example.com', expiresAt: '2030-01-01T00:00:00.000Z' })
    );

    expect(await getCachedUrl('abc')).toEqual({
      original: 'https://example.com',
      expiresAt: new Date('2030-01-01T00:00:00.000Z')
    });
  });

  it('fails open (returns undefined) when Redis throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('connection lost'));

    expect(await getCachedUrl('abc')).toBeUndefined();
  });
});

describe('setCachedUrl', () => {
  it('caches with the default TTL when there is no expiresAt', async () => {
    await setCachedUrl('abc', { original: 'https://example.com', expiresAt: null });

    expect(mockSet).toHaveBeenCalledWith(
      'url:code:abc',
      JSON.stringify({ original: 'https://example.com', expiresAt: null }),
      { expiration: { type: 'EX', value: 300 } }
    );
  });

  it('caps the TTL to the time left until expiresAt when that is sooner than the default', async () => {
    const soon = new Date(Date.now() + 30_000);

    await setCachedUrl('abc', { original: 'https://example.com', expiresAt: soon });

    expect(mockSet).toHaveBeenCalledTimes(1);
    const options = mockSet.mock.calls[0][2];
    expect(options.expiration.value).toBeLessThanOrEqual(30);
    expect(options.expiration.value).toBeGreaterThan(0);
  });

  it('does not cache an already-expired row', async () => {
    const past = new Date(Date.now() - 1000);

    await setCachedUrl('abc', { original: 'https://example.com', expiresAt: past });

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('fails open (does not throw) when Redis throws', async () => {
    mockSet.mockRejectedValueOnce(new Error('connection lost'));

    await expect(
      setCachedUrl('abc', { original: 'https://example.com', expiresAt: null })
    ).resolves.toBeUndefined();
  });
});

describe('invalidateUrlCache', () => {
  it('deletes the cache key', async () => {
    await invalidateUrlCache('abc');

    expect(mockDel).toHaveBeenCalledWith('url:code:abc');
  });

  it('fails open (does not throw) when Redis throws', async () => {
    mockDel.mockRejectedValueOnce(new Error('connection lost'));

    await expect(invalidateUrlCache('abc')).resolves.toBeUndefined();
  });
});
