import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from '../config.ts';

export const pgClient = postgres(config.databaseUrl);
export const db = drizzle({ client: pgClient });
