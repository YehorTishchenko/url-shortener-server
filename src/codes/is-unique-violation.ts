// Postgres SQLSTATE for unique_violation. The `postgres` driver exposes it
// as `error.code`, mapped from the wire protocol's ErrorResponse 'C' field.
const UNIQUE_VIOLATION = '23505';

function hasUniqueViolationCode(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    value.code === UNIQUE_VIOLATION
  );
}

// Drizzle wraps driver errors in a DrizzleQueryError, with the original
// PostgresError (the one carrying `.code`) as `.cause` — so a raw insert's
// error and a `db.insert(...)`'s error have different shapes. Walk the
// `.cause` chain to recognize both.
export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current) {
    if (hasUniqueViolationCode(current)) {
      return true;
    }
    current = current instanceof Error ? current.cause : undefined;
  }
  return false;
}
