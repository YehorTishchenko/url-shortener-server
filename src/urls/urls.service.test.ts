import { describe, it, expect, vi } from 'vitest';

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('../db/client.ts', () => ({
  db: { select: mockSelect }
}));

const { findUrlByCode, UrlLookupError } = await import('./urls.service.ts');

describe('findUrlByCode', () => {
  it('returns the row when the query succeeds', async () => {
    mockLimit.mockResolvedValueOnce([{ original: 'https://example.com', expiresAt: null }]);

    const result = await findUrlByCode('abc123');

    expect(result).toEqual({ original: 'https://example.com', expiresAt: null });
  });

  it('wraps a database failure in UrlLookupError, preserving the cause', async () => {
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
