import { redisClient } from '../redis/redis.ts';

const KEY_PREFIX = 'url:code:';
const DEFAULT_TTL_SECONDS = 5 * 60;

export interface CacheableUrl {
  original: string;
  expiresAt: Date | null;
}

interface CachedPayload {
  original: string;
  expiresAt: string | null;
}

function cacheKey(code: string): string {
  return `${KEY_PREFIX}${code}`;
}

function secondsUntil(date: Date): number {
  return Math.floor((date.getTime() - Date.now()) / 1000);
}

// The cache is a best-effort optimization on top of Postgres, not a source
// of truth: a Redis failure here should never break a lookup, so every
// function fails open (falls back as if there were simply no cache entry).
// Actual Redis connection errors still surface through the client's global
// 'error' handler wired up in server.ts, so outages aren't silently invisible.

export async function getCachedUrl(code: string): Promise<CacheableUrl | undefined> {
  try {
    const raw = await redisClient.get(cacheKey(code));
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as CachedPayload;
    return {
      original: parsed.original,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null
    };
  } catch {
    return undefined;
  }
}

export async function setCachedUrl(code: string, url: CacheableUrl): Promise<void> {
  const ttlSeconds = url.expiresAt ? Math.min(DEFAULT_TTL_SECONDS, secondsUntil(url.expiresAt)) : DEFAULT_TTL_SECONDS;

  if (ttlSeconds <= 0) {
    return;
  }

  try {
    const payload: CachedPayload = {
      original: url.original,
      expiresAt: url.expiresAt ? url.expiresAt.toISOString() : null
    };

    await redisClient.set(cacheKey(code), JSON.stringify(payload), {
      expiration: { type: 'EX', value: ttlSeconds }
    });
  } catch {
    // fail open — see note above
  }
}

export async function invalidateUrlCache(code: string): Promise<void> {
  try {
    await redisClient.del(cacheKey(code));
  } catch {
    // fail open — see note above
  }
}
