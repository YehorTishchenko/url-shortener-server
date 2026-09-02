// Postgres SQLSTATE for unique_violation. The `postgres` driver exposes it
// as `error.code`, mapped from the wire protocol's ErrorResponse 'C' field.
const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION
  );
}
