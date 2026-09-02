import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('../db/client.ts', () => ({
  db: { select: mockSelect }
}));

const mockGetCachedUrl = vi.fn();
const mockSetCachedUrl = vi.fn();

vi.mock('./urls.cache.ts', () => ({
  getCachedUrl: mockGetCachedUrl,
  setCachedUrl: mockSetCachedUrl
}));

const { findUrlByCode, UrlLookupError } = await import('./urls.service.ts');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findUrlByCode', () => {
  it('returns the cached value without querying the database on a cache hit', async () => {
    mockGetCachedUrl.mockResolvedValueOnce({ original: 'https://cached.example.com', expiresAt: null });

    const result = await findUrlByCode('abc123');

    expect(result).toEqual({ original: 'https://cached.example.com', expiresAt: null });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('queries the database and populates the cache on a cache miss', async () => {
    mockGetCachedUrl.mockResolvedValueOnce(undefined);
    mockLimit.mockResolvedValueOnce([{ original: 'https://example.com', expiresAt: null }]);

    const result = await findUrlByCode('abc123');

    expect(result).toEqual({ original: 'https://example.com', expiresAt: null });
    expect(mockSetCachedUrl).toHaveBeenCalledWith('abc123', { original: 'https://example.com', expiresAt: null });
  });

  it('does not populate the cache when the code is not found', async () => {
    mockGetCachedUrl.mockResolvedValueOnce(undefined);
    mockLimit.mockResolvedValueOnce([]);

    const result = await findUrlByCode('missing');

    expect(result).toBeUndefined();
    expect(mockSetCachedUrl).not.toHaveBeenCalled();
  });

  it('wraps a database failure in UrlLookupError, preserving the cause', async () => {
    mockGetCachedUrl.mockResolvedValueOnce(undefined);
    const dbError = new Error('connection terminated');
    mockLimit.mockRejectedValueOnce(dbError);

    let caught: unknown;
    try {
      await findUrlByCode('abc123');
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(UrlLookupError);
    expect((caught as InstanceType<typeof UrlLookupError>).cause).toBe(dbError);
    expect((caught as Error).message).toContain('abc123');
  });
});
