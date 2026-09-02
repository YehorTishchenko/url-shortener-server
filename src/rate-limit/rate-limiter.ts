import { redisClient } from '../redis/redis.ts';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// Fixed-window counter: INCR the per-key count and, only the first time the
// key is created (EXPIRE ... NX), attach a TTL for the window. Bundled into
// one MULTI so the increment and the TTL check happen in a single round trip
// without a race between separate requests.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const results = await redisClient
    .multi()
    .incr(key)
    .expire(key, windowSeconds, 'NX')
    .ttl(key)
    .exec();

  const [count, , ttl] = results as unknown as [number, boolean, number];

  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    retryAfterSeconds: ttl > 0 ? ttl : windowSeconds
  };
}
