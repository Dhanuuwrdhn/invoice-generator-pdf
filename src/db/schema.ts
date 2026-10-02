import { sql } from 'drizzle-orm';
import { check, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { InvoiceData } from '../types/invoice';

const tz = { withTimezone: true } as const;

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', tz),
    tokenBalance: integer('token_balance').notNull().default(0),
    createdAt: timestamp('created_at', tz).notNull().defaultNow(),
  },
  (t) => [check('users_token_balance_non_negative', sql`${t.tokenBalance} >= 0`)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', tz).notNull(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const emailTokens = pgTable('email_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose', { enum: ['verify', 'reset'] }).notNull(),
  expiresAt: timestamp('expires_at', tz).notNull(),
  usedAt: timestamp('used_at', tz),
});

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  fontFamily: text('font_family').notNull().default('Caladea'),
  primaryColor: text('primary_color').notNull().default('#1A3A5C'),
  logoPath: text('logo_path'),
  senderName: text('sender_name').notNull().default(''),
  senderTitle: text('sender_title').notNull().default(''),
  senderLocation: text('sender_location').notNull().default(''),
  senderPhone: text('sender_phone').notNull().default(''),
  senderEmail: text('sender_email').notNull().default(''),
  bankName: text('bank_name').notNull().default(''),
  accountNumber: text('account_number').notNull().default(''),
  accountHolder: text('account_holder').notNull().default(''),
  updatedAt: timestamp('updated_at', tz).notNull().defaultNow(),
});

export const templates = pgTable(
  'templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    data: jsonb('data').$type<InvoiceData>().notNull(),
    createdAt: timestamp('created_at', tz).notNull().defaultNow(),
  },
  (t) => [index('templates_user_id_idx').on(t.userId)],
);

// logo_path is a column (not inside data) so the client can never point an
// invoice at another user's file; it snapshots the logo at creation time.
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    invoiceNumber: text('invoice_number').notNull(),
    data: jsonb('data').$type<InvoiceData>().notNull(),
    logoPath: text('logo_path'),
    editCount: integer('edit_count').notNull().default(0),
    createdAt: timestamp('created_at', tz).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', tz).notNull().defaultNow(),
  },
  (t) => [index('invoices_user_created_idx').on(t.userId, t.createdAt.desc())],
);

export const tokenLedger = pgTable(
  'token_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    reason: text('reason', {
      enum: ['signup_bonus', 'invoice_create', 'invoice_edit', 'admin_topup'],
    }).notNull(),
    invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', tz).notNull().defaultNow(),
  },
  (t) => [index('token_ledger_user_id_idx').on(t.userId)],
);

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  windowStart: timestamp('window_start', tz).notNull(),
});

export type User = typeof users.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
