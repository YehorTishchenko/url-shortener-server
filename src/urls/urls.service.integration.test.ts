import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// generateCode is mocked so individual tests can force a real collision
// deterministically instead of hoping for one over enough random codes.
vi.mock('../codes/generate-code.ts', () => ({
  generateCode: vi.fn()
}));

let container: StartedPostgreSqlContainer;
let db: Awaited<ReturnType<typeof importDbClient>>['db'];
let pgClient: Awaited<ReturnType<typeof importDbClient>>['pgClient'];
let createUrl: Awaited<typeof import('./urls.service.ts')>['createUrl'];
let isUniqueViolation: Awaited<typeof import('../codes/is-unique-violation.ts')>['isUniqueViolation'];
let generateCode: ReturnType<typeof vi.fn>;

function importDbClient() {
  return import('../db/client.ts');
}

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:18-alpine').start();
  process.env.DATABASE_URL = container.getConnectionUri();

  ({ db, pgClient } = await importDbClient());
  ({ createUrl } = await import('./urls.service.ts'));
  ({ isUniqueViolation } = await import('../codes/is-unique-violation.ts'));
  ({ generateCode } = (await import('../codes/generate-code.ts')) as unknown as {
    generateCode: ReturnType<typeof vi.fn>;
  });

  await migrate(db, { migrationsFolder: './drizzle' });
});

afterAll(async () => {
  await pgClient.end();
  await container.stop();
});

beforeEach(async () => {
  await pgClient`delete from urls`;
  generateCode.mockReset();
  generateCode.mockImplementation(() => Math.random().toString(36).slice(2, 10).toUpperCase());
});

describe('createUrl against a real Postgres instance', () => {
  it('inserts a row and returns it', async () => {
    const result = await createUrl({ original: 'https://example.com/a' });

    expect(result.original).toBe('https://example.com/a');
    expect(typeof result.code).toBe('string');

    const rows = await pgClient`select original, code from urls where code = ${result.code}`;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ original: 'https://example.com/a', code: result.code });
  });

  it('a direct duplicate code insert triggers a real unique_violation recognized by isUniqueViolation', async () => {
    await pgClient`insert into urls (original, code) values ('https://example.com/b', 'DUPE0001')`;

    let caught: unknown;
    try {
      await pgClient`insert into urls (original, code) values ('https://example.com/c', 'DUPE0001')`;
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect(isUniqueViolation(caught)).toBe(true);
  });

  it('retries and recovers when the first generated code collides for real', async () => {
    await pgClient`insert into urls (original, code) values ('https://example.com/taken', 'TAKEN0001')`;

    generateCode
      .mockReturnValueOnce('TAKEN0001')
      .mockReturnValueOnce('FRESH0001');

    const result = await createUrl({ original: 'https://example.com/d' });

    expect(result).toEqual({ code: 'FRESH0001', original: 'https://example.com/d' });
    expect(generateCode).toHaveBeenCalledTimes(2);

    const rows = await pgClient`select code from urls where original = 'https://example.com/d'`;
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe('FRESH0001');
  });
});
