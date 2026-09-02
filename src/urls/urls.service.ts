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
