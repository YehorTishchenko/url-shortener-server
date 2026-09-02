import { generateCode } from './generate-code.ts';

export const DEFAULT_MAX_ATTEMPTS = 5;

export class CodeGenerationError extends Error {
  constructor(attempts: number) {
    super(`Failed to generate a unique code after ${attempts} attempts`);
    this.name = 'CodeGenerationError';
  }
}

export interface InsertCode {
  (code: string): Promise<void>;
}

export interface IsCollision {
  (error: unknown): boolean;
}

// Generates a random code and attempts to persist it via `insert`, retrying
// with a fresh code whenever `isCollision` recognizes the failure as a
// unique-constraint conflict. Any other error propagates immediately.
export async function createShortCode(
  insert: InsertCode,
  isCollision: IsCollision,
  maxAttempts = DEFAULT_MAX_ATTEMPTS
): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const code = generateCode();
    try {
      await insert(code);
      return code;
    } catch (err) {
      if (!isCollision(err)) {
        throw err;
      }
      if (attempt >= maxAttempts) {
        throw new CodeGenerationError(maxAttempts);
      }
    }
  }
}
