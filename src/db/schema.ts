import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const urls = pgTable('urls', {
  id: uuid('id').primaryKey().defaultRandom(),
  original: text('original').notNull(),
  code: varchar('code', { length: 15 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  author: uuid('author')
});
