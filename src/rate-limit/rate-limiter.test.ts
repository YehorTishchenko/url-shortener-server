import { describe, it, expect, vi } from 'vitest';

const mockExec = vi.fn();
const mockTtl = vi.fn(() => ({ exec: mockExec }));
const mockExpire = vi.fn(() => ({ ttl: mockTtl }));
const mockIncr = vi.fn(() => ({ expire: mockExpire }));
const mockMulti = vi.fn(() => ({ incr: mockIncr }));

vi.mock('../redis/redis.ts', () => ({
  redisClient: { multi: mockMulti }
}));

const { checkRateLimit } = await import('./rate-limiter.ts');

describe('checkRateLimit', () => {
  it('allows the request when under the limit', async () => {
    mockExec.mockResolvedValueOnce([3, true, 55]);

    const result = await checkRateLimit('ip:1.2.3.4', 10, 60);

    expect(result).toEqual({ allowed: true, remaining: 7, retryAfterSeconds: 55 });
  });

  it('blocks the request once the count exceeds the limit', async () => {
    mockExec.mockResolvedValueOnce([11, null, 42]);

    const result = await checkRateLimit('ip:1.2.3.4', 10, 60);

    expect(result).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 42 });
  });

  it('falls back to the full window when TTL is unavailable', async () => {
    mockExec.mockResolvedValueOnce([1, true, -1]);

    const result = await checkRateLimit('ip:1.2.3.4', 10, 60);

    expect(result.retryAfterSeconds).toBe(60);
  });
});
