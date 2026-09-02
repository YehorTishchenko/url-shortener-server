import { eq } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { urls } from '../db/schema.ts';
import { createShortCode } from '../codes/create-short-code.ts';
import { isUniqueViolation } from '../codes/is-unique-violation.ts';

export interface CreateUrlInput {
  original: string;
}

export interface CreateUrlResult {
  code: string;
  original: string;
}

export async function createUrl({ original }: CreateUrlInput): Promise<CreateUrlResult> {
  const code = await createShortCode(
    async (code) => {
      await db.insert(urls).values({ original, code });
    },
    isUniqueViolation
  );

  return { code, original };
}

export interface FindUrlByCodeResult {
  original: string;
  expiresAt: Date | null;
}

export class UrlLookupError extends Error {
  constructor(code: string, cause: unknown) {
    super(`Failed to look up short code "${code}"`, { cause });
    this.name = 'UrlLookupError';
  }
}

export async function findUrlByCode(code: string): Promise<FindUrlByCodeResult | undefined> {
  try {
    const [row] = await db
      .select({ original: urls.original, expiresAt: urls.expiresAt })
      .from(urls)
      .where(eq(urls.code, code))
      .limit(1);

    return row;
  } catch (err) {
    throw new UrlLookupError(code, err);
  }
}
