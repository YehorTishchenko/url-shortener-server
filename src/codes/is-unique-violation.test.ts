import { describe, it, expect } from 'vitest';
import { isUniqueViolation } from './is-unique-violation.ts';

describe('isUniqueViolation', () => {
  it('returns true for a Postgres unique_violation error (SQLSTATE 23505)', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  it('returns false for other Postgres error codes', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false); // foreign_key_violation
  });

  it('returns false for non-error values', () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation('some string')).toBe(false);
    expect(isUniqueViolation(new Error('generic'))).toBe(false);
  });

  it('recognizes a unique_violation wrapped in a DrizzleQueryError-style .cause chain', () => {
    const rawPostgresError = { code: '23505' };
    const wrapped = new Error('Failed query: ...', { cause: rawPostgresError });

    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it('returns false when the .cause chain never reaches a matching code', () => {
    const wrapped = new Error('Failed query: ...', { cause: new Error('connection reset') });

    expect(isUniqueViolation(wrapped)).toBe(false);
  });
});
