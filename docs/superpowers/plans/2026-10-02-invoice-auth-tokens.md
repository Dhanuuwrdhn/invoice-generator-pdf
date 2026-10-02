# Invoice Accounts, Tokens & Docker Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the invoice generator behind email/password accounts with per-user style, templates, invoice history and a token balance, and deploy it as its own Docker Compose stack (app + Postgres) at `https://invoice.bornworks.biz.id`.

**Architecture:** Next.js 16 App Router app with hand-written session auth (`node:crypto` scrypt, SHA-256-hashed session tokens in Postgres, `httpOnly` cookie, `proxy.ts` as an optimistic gate). Data access via Drizzle ORM over `postgres` (postgres-js); all token movements go through one transaction-scoped module that writes an audit ledger. Business logic lives in plain service modules under `src/lib/**` (unit-tested against a real Postgres); server actions and pages are thin wrappers. Production runs as a separate compose project on the existing VPS, joined to the landing page's Caddy through an external Docker network `web`.

**Tech Stack:** Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind v4, `@react-pdf/renderer` 4, drizzle-orm 0.45.3 + drizzle-kit 0.31.11, postgres 3.4.9, zod 4.6.5, nodemailer 8 (Resend SMTP), Vitest 5, Postgres 17, Docker Compose, Caddy 2, GitHub Actions + GHCR.

**Spec:** `docs/superpowers/specs/2026-10-02-invoice-auth-tokens-design.md`

## Global Constraints

- Branch: `master`. Push directly is allowed for this repo (the PR-only rule covers `sunny-mobile`/`sunny-cms` only).
- Commit identity (this laptop has none configured): `git -c user.name=Dhanuuwrdhn -c user.email=dhanuwardhan10@gmail.com commit ...`. Conventional Commits, English, **no AI attribution trailers**.
- Code comments in English; match the surrounding code style (single quotes, 2-space indent, semicolons).
- UI copy stays English like the existing app.
- Next.js 16: request APIs are async (`await cookies()`, `await headers()`, `params`/`searchParams` are Promises); route protection file is `src/proxy.ts` exporting `proxy`, not `middleware`. Read `node_modules/next/dist/docs/` before using any other Next API.
- Token rules (verbatim from spec): verification +10 once; new invoice −1; edit *n* costs 1 iff `n % 6 == 0`; saving unchanged data is not an edit; re-download is free; balance 0 on a paid action → reject, nothing changes.
- `users.token_balance` must always equal `SUM(token_ledger.delta)` for that user; balance can never go below 0.
- Sessions: cookie `session`, raw 32-byte token in cookie, SHA-256 hex in DB, 30-day expiry, `httpOnly; Secure (prod); SameSite=Lax; Path=/`.
- Email tokens: 1 hour, single use, stored as SHA-256 hex.
- Password: min 8 chars; scrypt N=2^15, r=8, p=1, 16-byte salt, 64-byte key, stored as `scrypt$N$r$p$salt_b64$key_b64`.
- Rate limits: login 5 / 15 min per IP+email; register 3 / hour per IP; resend verification 1 / minute per user; forgot password 3 / hour per IP. Client IP = **last** `X-Forwarded-For` entry (set by Caddy).
- Logo: PNG or JPEG by magic bytes, ≤ 500 KB, stored under `UPLOAD_DIR/<user_id>/logo-<uuid>.<png|jpg>`; never served to another user.
- No plaintext password anywhere in the repo, `.env`, CI logs or command lines. Admins come from `ADMIN_EMAILS`; admin accounts are created with `scripts/create-user.mjs` reading the password from stdin.
- Never commit generated build output or `.env*`; Drizzle migration SQL under `drizzle/` **is** committed (it is source, not build output).
- Postgres is never published to a public host port. The only host-port Postgres in this plan is the temporary test DB bound to `127.0.0.1` on the VPS.

## Review Focus

1. **Double-clicking "Generate" on a new invoice** — a person expects one invoice and −1 token, not two. Button is disabled while pending and the form switches to edit mode after the first success; pinned by the E2E double-click step in Task 12.
2. **Email typed with different case/whitespace** (`" User@Example.com "` at register, `user@example.com` at login) — expected to be the same account. Pinned in Task 5 (`normalizes email`).
3. **Oversized or hostile invoice payloads** (1,000 items, 50 KB strings, negative qty, `NaN` price) sent straight to the server action — expected a validation error, not a crash or a giant PDF. Pinned in Task 6 (`invoiceDataSchema` tests).
4. **Stale/expired session cookie** still present in the browser — `proxy.ts` lets it through, the page must send the person to `/login`, not 500. Pinned in Task 4 (`expired session returns null`) and Task 7 (`requireUser` redirect path covered by E2E logout/login).
5. **Logo file renamed to `.png` but actually SVG/HTML**, and **changing the logo after an invoice was made** — expected: rejected upload; old invoices keep the old logo. Pinned in Task 8 (`rejects non-image bytes`, `old logo file survives replacement`).

---

## File Structure

```
drizzle.config.ts                     drizzle-kit config (generate only)
drizzle/                              generated SQL migrations (committed)
vitest.config.ts                      test env + alias, serial files
tests/setup/global-setup.ts           runs migrations on the test DB
tests/helpers/db.ts                   resetDb(), makeUser(), ledgerSum()
scripts/create-user.mjs               admin/user bootstrap, password via stdin
Dockerfile, .dockerignore             standalone image
docker-compose.yml                    app + postgres (prod, ~/invoice on VPS)
.github/workflows/ci-cd.yml           lint, typecheck, test, build, deploy
src/proxy.ts                          optimistic auth gate
src/instrumentation.ts                run migrations on server start
src/db/schema.ts                      all tables + inferred types
src/db/index.ts                       lazy drizzle client, Db/Tx types
src/db/migrate.ts                     runMigrations()
src/lib/auth/password.mjs             hashPassword/verifyPassword (shared with script)
src/lib/auth/session.ts               DB session CRUD
src/lib/auth/email-tokens.ts          issue/consume single-use email tokens
src/lib/auth/service.ts               register/verify/authenticate/reset/change password
src/lib/auth/current-user.ts          cookie helpers + require* guards (next/headers)
src/lib/auth/admin-emails.ts          isAdminEmail()
src/lib/auth/emails.ts                verification/reset/account-exists mails
src/lib/rate-limit.ts                 hitRateLimit(), RATE_LIMITS
src/lib/request-ip.ts                 getClientIp()
src/lib/mail.ts                       sendMail() (SMTP or dev console)
src/lib/tokens.ts                     chargeToken/grantTokens, OutOfTokensError
src/lib/validation.ts                 zod schemas (credentials, invoice, settings)
src/lib/invoices/rules.ts             isPaidEdit(), nextPaidEdit()
src/lib/invoices/empty.ts             emptyInvoiceData(), newItem()
src/lib/invoices/style.ts             FONTS, FONT_CSS, COLOR_PRESETS (moved from form)
src/lib/invoices/service.ts           create/update/get/list invoices
src/lib/templates.ts                  list/save/delete templates
src/lib/settings.ts                   get/save settings, setLogoPath, defaults
src/lib/logo.ts                       detect/save/read logo files
src/lib/pdf.ts                        renderInvoicePdf()
src/lib/admin.ts                      listUsersForAdmin(), topUpTokens()
src/app/(auth)/layout.tsx             centered card shell
src/app/(auth)/actions.ts             auth server actions
src/app/(auth)/forms.tsx              client forms (useActionState)
src/app/(auth)/{login,register,verify,forgot,reset}/page.tsx
src/app/(app)/layout.tsx              header: email, balance, nav, logout
src/app/(app)/invoices/page.tsx       history list
src/app/(app)/invoices/actions.ts     invoice + template actions
src/app/(app)/invoices/new/page.tsx
src/app/(app)/invoices/[id]/page.tsx
src/app/(app)/invoices/[id]/pdf/route.ts
src/app/(app)/settings/{page.tsx,actions.ts,settings-form.tsx}
src/app/(app)/settings/logo/route.ts
src/app/(app)/admin/{page.tsx,actions.ts}
src/app/healthz/route.ts
src/app/generator/page.tsx            redirect → /invoices/new
src/components/InvoiceForm.tsx        modified: server-backed
src/components/pdf/InvoicePDF.tsx     modified: optional logo
```

Deleted: `src/app/api/generate-pdf/route.ts`, `public/music/Beautiful In White.mp3`.

---

### Task 1: Test database, schema and migrations

**Files:**
- Modify: `package.json`, `.gitignore`
- Create: `drizzle.config.ts`, `vitest.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/migrate.ts`, `tests/setup/global-setup.ts`, `tests/helpers/db.ts`, `tests/db/schema.test.ts`, `drizzle/*` (generated)

**Interfaces:**
- Produces: `getDb(): Db`, `type Db`, `type Tx`, `runMigrations(): Promise<void>`; tables `users, sessions, emailTokens, userSettings, templates, invoices, tokenLedger, rateLimits`; types `User`, `Invoice`; test helpers `resetDb()`, `makeUser(email?, opts?) : Promise<User>`, `ledgerSum(userId): Promise<number>`.

- [ ] **Step 1: Start the test Postgres on the VPS and a local tunnel**

The laptop has no Docker. Use a throwaway Postgres on the VPS bound to loopback only (not reachable from the internet), reached through an SSH tunnel.

```bash
ssh bornworks 'docker run -d --name invoice-testdb --restart unless-stopped -e POSTGRES_PASSWORD=test -e POSTGRES_DB=invoice_test -p 127.0.0.1:55432:5432 postgres:17-alpine && docker ps --filter name=invoice-testdb --format "{{.Status}}"'
```

Then start the tunnel as a background command (keep it running for the whole plan):

```bash
ssh -N -L 55432:127.0.0.1:55432 bornworks
```

Expected: container `Up`, tunnel process stays alive. `TEST_DATABASE_URL` for all later steps: `postgres://postgres:test@127.0.0.1:55432/invoice_test` (this is the default in `vitest.config.ts`).

- [ ] **Step 2: Install dependencies and add scripts**

```bash
npm install drizzle-orm@0.45.3 postgres@3.4.9 zod@4.6.5 nodemailer@^8.0.6
npm install -D drizzle-kit@0.31.11 vitest@5.0.3 @types/nodemailer@^8.0.0
```

In `package.json` `scripts`, add:

```json
"test": "vitest run",
"db:generate": "drizzle-kit generate"
```

Append to `.gitignore`:

```
# uploads
/uploads
/.test-uploads
```

- [ ] **Step 3: Write `drizzle.config.ts`, `vitest.config.ts`, schema, client and migrator**

`drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
```

`vitest.config.ts` (env is set on the main process so the global setup and workers inherit it; it only ever points at the test DB):

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:test@127.0.0.1:55432/invoice_test';
process.env.UPLOAD_DIR = path.resolve('.test-uploads');
process.env.ADMIN_EMAILS = 'admin@example.com';
process.env.APP_URL = 'http://localhost:3000';

export default defineConfig({
  resolve: { alias: { '@': path.resolve('src') } },
  test: {
    environment: 'node',
    globalSetup: ['tests/setup/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
```

`src/db/schema.ts` (relative imports only — drizzle-kit does not resolve the `@/` alias):

```ts
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
```

`src/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return drizzle(postgres(url, { max: 10 }), { schema });
}

let db: ReturnType<typeof create> | undefined;

// Lazy so `next build` can import modules without a database.
export function getDb() {
  return (db ??= create());
}

export type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
```

`src/db/migrate.ts`:

```ts
import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from './index';

export async function runMigrations() {
  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
}
```

`tests/setup/global-setup.ts`:

```ts
import { runMigrations } from '../../src/db/migrate';

export default async function setup() {
  await runMigrations();
}
```

`tests/helpers/db.ts`:

```ts
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { tokenLedger, users, type User } from '@/db/schema';

export async function resetDb() {
  await getDb().execute(sql`TRUNCATE users, rate_limits RESTART IDENTITY CASCADE`);
}

export async function makeUser(
  email = 'u1@example.com',
  opts: { verified?: boolean; balance?: number } = {},
): Promise<User> {
  const [user] = await getDb()
    .insert(users)
    .values({
      email,
      passwordHash: 'unused',
      emailVerifiedAt: opts.verified === false ? null : new Date(),
      tokenBalance: opts.balance ?? 0,
    })
    .returning();
  if (opts.balance) {
    await getDb().insert(tokenLedger).values({ userId: user.id, delta: opts.balance, reason: 'admin_topup' });
  }
  return user;
}

export async function ledgerSum(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ sum: sql<string>`coalesce(sum(${tokenLedger.delta}), 0)` })
    .from(tokenLedger)
    .where(eq(tokenLedger.userId, userId));
  return Number(row.sum);
}
```

- [ ] **Step 4: Generate the migration**

Run: `npm run db:generate`
Expected: a new `drizzle/0000_*.sql` plus `drizzle/meta/*`. Open the SQL and confirm it contains `CREATE TABLE "users"`, the `users_token_balance_non_negative` CHECK, and `ON DELETE cascade` foreign keys.

- [ ] **Step 5: Write the schema test**

`tests/db/schema.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';
import { makeUser, resetDb } from '../helpers/db';

describe('schema', () => {
  beforeEach(resetDb);

  it('rejects a negative token balance', async () => {
    const user = await makeUser();
    await expect(
      getDb().update(users).set({ tokenBalance: -1 }).where(eq(users.id, user.id)),
    ).rejects.toThrow(/users_token_balance_non_negative/);
  });

  it('cascades user deletion to sessions', async () => {
    const user = await makeUser();
    await getDb().insert(sessions).values({ id: 'h', userId: user.id, expiresAt: new Date(Date.now() + 1000) });
    await getDb().delete(users).where(eq(users.id, user.id));
    expect(await getDb().select().from(sessions)).toHaveLength(0);
  });
});
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: 2 passed. (If it fails with `ECONNREFUSED 127.0.0.1:55432`, the tunnel from Step 1 is not running.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .gitignore drizzle.config.ts vitest.config.ts drizzle src/db tests
git commit -m "feat: add postgres schema, migrations, and test harness"
```

---

### Task 2: Password hashing

**Files:**
- Create: `src/lib/auth/password.mjs`, `tests/auth/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(password: string): Promise<string>`, `verifyPassword(password: string, stored: string): Promise<boolean>` (plain ESM so `scripts/create-user.mjs` can import it without a build step).

- [ ] **Step 1: Write the failing test**

`tests/auth/password.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password.mjs';

describe('password', () => {
  it('hashes into the scrypt$N$r$p$salt$key format', async () => {
    const stored = await hashPassword('correct horse');
    expect(stored).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  });

  it('verifies the right password and rejects the wrong one', async () => {
    const stored = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('correct horsf', stored)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('returns false for malformed stored values', async () => {
    expect(await verifyPassword('x', 'unused')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$1$2$3$!!$!!')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/auth/password.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/password.mjs`.

- [ ] **Step 3: Implement**

`src/lib/auth/password.mjs`:

```js
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

const N = 32768;
const R = 8;
const P = 1;
const KEY_LEN = 64;
// N=2^15 with r=8 needs 32 MiB, which is exactly Node's default maxmem.
const MAX_MEM = 64 * 1024 * 1024;

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = /** @type {Buffer} */ (await scrypt(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: MAX_MEM }));
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

/**
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  if (expected.length === 0) return false;
  try {
    const key = /** @type {Buffer} */ (
      await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: MAX_MEM,
      })
    );
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/auth/password.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password.mjs tests/auth/password.test.ts
git commit -m "feat: add scrypt password hashing"
```

---

### Task 3: Rate limiting and client IP

**Files:**
- Create: `src/lib/rate-limit.ts`, `src/lib/request-ip.ts`, `tests/rate-limit.test.ts`

**Interfaces:**
- Consumes: `getDb()` (Task 1).
- Produces: `hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>` (true = allowed); `RATE_LIMITS: { login, register, resendVerification, forgot }` each `{ limit, windowSeconds }`; `getClientIp(headers: Headers): string`.

- [ ] **Step 1: Write the failing tests**

`tests/rate-limit.test.ts`:

```ts
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { hitRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { resetDb } from './helpers/db';

describe('hitRateLimit', () => {
  beforeEach(resetDb);

  it('allows up to the limit then blocks', async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit('login:1.2.3.4', 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });

  it('keeps keys independent', async () => {
    await hitRateLimit('a', 1, 60);
    expect(await hitRateLimit('b', 1, 60)).toBe(true);
  });

  it('opens a new window after the old one expires', async () => {
    await hitRateLimit('k', 1, 60);
    expect(await hitRateLimit('k', 1, 60)).toBe(false);
    await getDb().execute(sql`UPDATE rate_limits SET window_start = now() - interval '2 minutes' WHERE key = 'k'`);
    expect(await hitRateLimit('k', 1, 60)).toBe(true);
  });
});

describe('getClientIp', () => {
  it('uses the last X-Forwarded-For entry (the one Caddy appended)', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '6.6.6.6, 9.9.9.9' }))).toBe('9.9.9.9');
  });

  it('falls back to unknown', () => {
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/rate-limit.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/rate-limit.ts`:

```ts
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const RATE_LIMITS = {
  login: { limit: 5, windowSeconds: 15 * 60 },
  register: { limit: 3, windowSeconds: 60 * 60 },
  resendVerification: { limit: 1, windowSeconds: 60 },
  forgot: { limit: 3, windowSeconds: 60 * 60 },
} as const;

// Fixed window counter in Postgres; returns true while the caller is within the limit.
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await getDb().execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, count, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision) THEN 1
        ELSE rate_limits.count + 1 END,
      window_start = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision) THEN now()
        ELSE rate_limits.window_start END
    RETURNING count`);
  return Number(rows[0].count) <= limit;
}
```

`src/lib/request-ip.ts`:

```ts
// Caddy appends the real client address as the last X-Forwarded-For entry;
// anything before it is client-controlled.
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const last = forwarded?.split(',').pop()?.trim();
  return last || headers.get('x-real-ip') || 'unknown';
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/rate-limit.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limit.ts src/lib/request-ip.ts tests/rate-limit.test.ts
git commit -m "feat: add postgres-backed rate limiting"
```

---

### Task 4: Sessions and single-use email tokens

**Files:**
- Create: `src/lib/auth/session.ts`, `src/lib/auth/email-tokens.ts`, `tests/auth/session.test.ts`, `tests/auth/email-tokens.test.ts`

**Interfaces:**
- Consumes: `getDb()`, `Tx`, `users`, `sessions`, `emailTokens` (Task 1).
- Produces:
  - `SESSION_COOKIE = 'session'`, `hashToken(raw: string): string`
  - `createSession(userId: string): Promise<{ token: string; expiresAt: Date }>`
  - `getUserBySessionToken(token: string): Promise<User | null>`
  - `deleteSession(token: string): Promise<void>`, `deleteAllSessions(userId: string, tx?: Tx): Promise<void>`
  - `issueEmailToken(userId: string, purpose: 'verify' | 'reset'): Promise<string>` (raw token)
  - `consumeEmailToken(raw: string, purpose: 'verify' | 'reset', tx?: Tx): Promise<string | null>` (userId)

- [ ] **Step 1: Write the failing tests**

`tests/auth/session.test.ts`:

```ts
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { createSession, deleteAllSessions, deleteSession, getUserBySessionToken } from '@/lib/auth/session';
import { makeUser, resetDb } from '../helpers/db';

describe('sessions', () => {
  beforeEach(resetDb);

  it('resolves a fresh session to its user and stores only a hash', async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id);
    expect((await getUserBySessionToken(token))?.id).toBe(user.id);
    const rows = await getDb().execute<{ id: string }>(sql`SELECT id FROM sessions`);
    expect(rows[0].id).not.toBe(token);
    expect(rows[0].id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('expired session returns null', async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id);
    await getDb().execute(sql`UPDATE sessions SET expires_at = now() - interval '1 second'`);
    expect(await getUserBySessionToken(token)).toBeNull();
  });

  it('unknown token returns null', async () => {
    expect(await getUserBySessionToken('nope')).toBeNull();
  });

  it('deletes one or all sessions', async () => {
    const user = await makeUser();
    const a = await createSession(user.id);
    const b = await createSession(user.id);
    await deleteSession(a.token);
    expect(await getUserBySessionToken(a.token)).toBeNull();
    expect(await getUserBySessionToken(b.token)).not.toBeNull();
    await deleteAllSessions(user.id);
    expect(await getUserBySessionToken(b.token)).toBeNull();
  });
});
```

`tests/auth/email-tokens.test.ts`:

```ts
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { consumeEmailToken, issueEmailToken } from '@/lib/auth/email-tokens';
import { makeUser, resetDb } from '../helpers/db';

describe('email tokens', () => {
  beforeEach(resetDb);

  it('can be consumed exactly once', async () => {
    const user = await makeUser();
    const raw = await issueEmailToken(user.id, 'verify');
    expect(await consumeEmailToken(raw, 'verify')).toBe(user.id);
    expect(await consumeEmailToken(raw, 'verify')).toBeNull();
  });

  it('does not cross purposes', async () => {
    const user = await makeUser();
    const raw = await issueEmailToken(user.id, 'verify');
    expect(await consumeEmailToken(raw, 'reset')).toBeNull();
  });

  it('expires after its deadline', async () => {
    const user = await makeUser();
    const raw = await issueEmailToken(user.id, 'reset');
    await getDb().execute(sql`UPDATE email_tokens SET expires_at = now() - interval '1 second'`);
    expect(await consumeEmailToken(raw, 'reset')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/auth`
Expected: FAIL — modules not found (password tests still pass).

- [ ] **Step 3: Implement**

`src/lib/auth/session.ts`:

```ts
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { getDb, type Tx } from '@/db';
import { sessions, users, type User } from '@/db/schema';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await getDb().insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string): Promise<User | null> {
  const rows = await getDb()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.id, hashToken(token)));
}

export async function deleteAllSessions(userId: string, tx?: Tx): Promise<void> {
  await (tx ?? getDb()).delete(sessions).where(eq(sessions.userId, userId));
}
```

`src/lib/auth/email-tokens.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDb, type Tx } from '@/db';
import { emailTokens } from '@/db/schema';
import { hashToken } from './session';

const EMAIL_TOKEN_TTL_MS = 60 * 60 * 1000;

export type EmailTokenPurpose = 'verify' | 'reset';

export async function issueEmailToken(userId: string, purpose: EmailTokenPurpose): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  await getDb().insert(emailTokens).values({
    tokenHash: hashToken(raw),
    userId,
    purpose,
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
  });
  return raw;
}

// Single UPDATE so two concurrent clicks cannot both succeed.
export async function consumeEmailToken(raw: string, purpose: EmailTokenPurpose, tx?: Tx): Promise<string | null> {
  const rows = await (tx ?? getDb())
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailTokens.tokenHash, hashToken(raw)),
        eq(emailTokens.purpose, purpose),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: emailTokens.userId });
  return rows[0]?.userId ?? null;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/auth`
Expected: all passed (4 password + 4 session + 3 email-token).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/session.ts src/lib/auth/email-tokens.ts tests/auth
git commit -m "feat: add database sessions and single-use email tokens"
```

---

### Task 5: Token ledger and account service

**Files:**
- Create: `src/lib/tokens.ts`, `src/lib/auth/service.ts`, `src/lib/validation.ts` (credentials part), `tests/auth/service.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 4.
- Produces:
  - `SIGNUP_BONUS = 10`; `class OutOfTokensError extends Error`
  - `chargeToken(tx: Tx, userId: string, reason: 'invoice_create' | 'invoice_edit', invoiceId: string): Promise<void>` (throws `OutOfTokensError`)
  - `grantTokens(tx: Tx, userId: string, amount: number, reason: 'signup_bonus' | 'admin_topup', actorUserId?: string): Promise<void>`
  - `normalizeEmail(email: string): string`
  - `registerUser(email, password): Promise<{ kind: 'created'; userId: string; verifyToken: string } | { kind: 'exists'; userId: string }>`
  - `verifyEmail(rawToken: string): Promise<string | null>` (userId)
  - `authenticate(email, password): Promise<User | null>`
  - `requestPasswordReset(email): Promise<string | null>` (raw token)
  - `resetPassword(rawToken, newPassword): Promise<boolean>`
  - `changePassword(userId, currentPassword, newPassword): Promise<boolean>`
  - `credentialsSchema` (zod: `{ email, password }`, password min 8 max 200), `loginSchema` (password min 1)

- [ ] **Step 1: Write the failing tests**

`tests/auth/service.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { tokenLedger, users } from '@/db/schema';
import {
  authenticate,
  changePassword,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from '@/lib/auth/service';
import { createSession, getUserBySessionToken } from '@/lib/auth/session';
import { credentialsSchema } from '@/lib/validation';
import { ledgerSum, resetDb } from '../helpers/db';

async function registered(email = 'a@example.com', password = 'password1') {
  const result = await registerUser(email, password);
  if (result.kind !== 'created') throw new Error('expected created');
  return result;
}

describe('account service', () => {
  beforeEach(resetDb);

  it('normalizes email', async () => {
    await registered(' User@Example.COM ', 'password1');
    expect(await authenticate('user@example.com', 'password1')).not.toBeNull();
  });

  it('reports an existing account instead of creating a second one', async () => {
    const first = await registered();
    const second = await registerUser('A@example.com', 'other-pass');
    expect(second).toEqual({ kind: 'exists', userId: first.userId });
  });

  it('starts at zero tokens and grants the bonus exactly once on verification', async () => {
    const { userId, verifyToken } = await registered();
    const [before] = await getDb().select().from(users).where(eq(users.id, userId));
    expect(before.tokenBalance).toBe(0);

    expect(await verifyEmail(verifyToken)).toBe(userId);
    expect(await verifyEmail(verifyToken)).toBeNull();

    const [after] = await getDb().select().from(users).where(eq(users.id, userId));
    expect(after.tokenBalance).toBe(10);
    expect(after.emailVerifiedAt).not.toBeNull();
    const ledger = await getDb().select().from(tokenLedger).where(eq(tokenLedger.userId, userId));
    expect(ledger.map((l) => [l.delta, l.reason])).toEqual([[10, 'signup_bonus']]);
    expect(await ledgerSum(userId)).toBe(10);
  });

  it('rejects wrong passwords and unknown emails', async () => {
    await registered();
    expect(await authenticate('a@example.com', 'wrong-pass')).toBeNull();
    expect(await authenticate('nobody@example.com', 'password1')).toBeNull();
  });

  it('resets the password once and signs out every session', async () => {
    const { userId } = await registered();
    const { token: sessionToken } = await createSession(userId);
    const raw = await requestPasswordReset('a@example.com');
    expect(raw).not.toBeNull();

    expect(await resetPassword(raw!, 'new-password')).toBe(true);
    expect(await resetPassword(raw!, 'another-one')).toBe(false);
    expect(await getUserBySessionToken(sessionToken)).toBeNull();
    expect(await authenticate('a@example.com', 'new-password')).not.toBeNull();
    expect(await authenticate('a@example.com', 'password1')).toBeNull();
  });

  it('returns no reset token for unknown emails', async () => {
    expect(await requestPasswordReset('ghost@example.com')).toBeNull();
  });

  it('changes the password only with the current one', async () => {
    const { userId } = await registered();
    expect(await changePassword(userId, 'wrong-pass', 'new-password')).toBe(false);
    expect(await changePassword(userId, 'password1', 'new-password')).toBe(true);
    expect(await authenticate('a@example.com', 'new-password')).not.toBeNull();
  });

  it('validates credentials', () => {
    expect(credentialsSchema.safeParse({ email: 'x@y.co', password: 'short' }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: 'not-an-email', password: 'password1' }).success).toBe(false);
    expect(credentialsSchema.parse({ email: ' X@Y.co ', password: 'password1' }).email).toBe('x@y.co');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/auth/service.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/tokens.ts`:

```ts
import { and, eq, gt, sql } from 'drizzle-orm';
import type { Tx } from '@/db';
import { tokenLedger, users } from '@/db/schema';

export const SIGNUP_BONUS = 10;

export class OutOfTokensError extends Error {
  constructor() {
    super('Out of tokens');
  }
}

// The conditional UPDATE is the guard: zero rows means the balance was 0,
// so concurrent charges can never push it below zero.
export async function chargeToken(
  tx: Tx,
  userId: string,
  reason: 'invoice_create' | 'invoice_edit',
  invoiceId: string,
): Promise<void> {
  const rows = await tx
    .update(users)
    .set({ tokenBalance: sql`${users.tokenBalance} - 1` })
    .where(and(eq(users.id, userId), gt(users.tokenBalance, 0)))
    .returning({ id: users.id });
  if (rows.length === 0) throw new OutOfTokensError();
  await tx.insert(tokenLedger).values({ userId, delta: -1, reason, invoiceId });
}

export async function grantTokens(
  tx: Tx,
  userId: string,
  amount: number,
  reason: 'signup_bonus' | 'admin_topup',
  actorUserId?: string,
): Promise<void> {
  const rows = await tx
    .update(users)
    .set({ tokenBalance: sql`${users.tokenBalance} + ${amount}` })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  if (rows.length === 0) throw new Error(`User ${userId} not found`);
  await tx.insert(tokenLedger).values({ userId, delta: amount, reason, actorUserId });
}
```

`src/lib/validation.ts` (credentials only for now; Task 6 and 8 append to this file):

```ts
import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const credentialsSchema = z.object({
  email,
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(200),
});
```

`src/lib/auth/service.ts`:

```ts
import { eq, isNull, and } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, type User } from '@/db/schema';
import { grantTokens, SIGNUP_BONUS } from '@/lib/tokens';
import { consumeEmailToken, issueEmailToken } from './email-tokens';
import { hashPassword, verifyPassword } from './password.mjs';
import { deleteAllSessions } from './session';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(
  rawEmail: string,
  password: string,
): Promise<{ kind: 'created'; userId: string; verifyToken: string } | { kind: 'exists'; userId: string }> {
  const email = normalizeEmail(rawEmail);
  const passwordHash = await hashPassword(password);
  const inserted = await getDb()
    .insert(users)
    .values({ email, passwordHash })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (inserted.length === 0) {
    const [existing] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email));
    return { kind: 'exists', userId: existing.id };
  }
  const userId = inserted[0].id;
  return { kind: 'created', userId, verifyToken: await issueEmailToken(userId, 'verify') };
}

export async function verifyEmail(rawToken: string): Promise<string | null> {
  return getDb().transaction(async (tx) => {
    const userId = await consumeEmailToken(rawToken, 'verify', tx);
    if (!userId) return null;
    const marked = await tx
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.emailVerifiedAt)))
      .returning({ id: users.id });
    // Only the first verification earns the bonus.
    if (marked.length > 0) await grantTokens(tx, userId, SIGNUP_BONUS, 'signup_bonus');
    return userId;
  });
}

let dummyHash: Promise<string> | undefined;

export async function authenticate(rawEmail: string, password: string): Promise<User | null> {
  const [user] = await getDb().select().from(users).where(eq(users.email, normalizeEmail(rawEmail)));
  if (!user) {
    // Spend the same time as a real check so response time does not reveal registered emails.
    await verifyPassword(password, await (dummyHash ??= hashPassword('timing-equalizer')));
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

export async function requestPasswordReset(rawEmail: string): Promise<string | null> {
  const [user] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizeEmail(rawEmail)));
  return user ? issueEmailToken(user.id, 'reset') : null;
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);
  return getDb().transaction(async (tx) => {
    const userId = await consumeEmailToken(rawToken, 'reset', tx);
    if (!userId) return false;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await deleteAllSessions(userId, tx);
    return true;
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const [user] = await getDb().select().from(users).where(eq(users.id, userId));
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) return false;
  await getDb().update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, userId));
  return true;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/auth/service.test.ts`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokens.ts src/lib/validation.ts src/lib/auth/service.ts tests/auth/service.test.ts
git commit -m "feat: add account service with signup bonus ledger"
```

---

### Task 6: Invoice validation, token rules and invoice service

**Files:**
- Modify: `src/types/invoice.ts` (no shape change; add `FONT_CHOICES`), `src/lib/validation.ts` (append)
- Create: `src/lib/invoices/rules.ts`, `src/lib/invoices/empty.ts`, `src/lib/invoices/service.ts`, `tests/invoices/rules.test.ts`, `tests/invoices/validation.test.ts`, `tests/invoices/service.test.ts`

**Interfaces:**
- Consumes: `chargeToken`, `OutOfTokensError` (Task 5); `getDb`, `invoices`, `users` (Task 1).
- Produces:
  - `FONT_CHOICES: readonly FontChoice[]` in `src/types/invoice.ts`
  - `invoiceDataSchema` (zod, output type `InvoiceData`)
  - `isPaidEdit(editCount: number): boolean`, `nextPaidEdit(editCount: number): number`
  - `emptyInvoiceData(): InvoiceData`, `newItem(): InvoiceItem`
  - `type RenderPdf = (data: InvoiceData, logoPath: string | null) => Promise<Buffer>`
  - `class InvoiceNotFoundError extends Error`
  - `createInvoice(userId, data, logoPath: string | null, render: RenderPdf): Promise<{ id: string }>`
  - `updateInvoice(userId, id, data, render): Promise<{ unchanged: boolean; editCount: number; charged: boolean }>`
  - `getInvoice(userId, id): Promise<Invoice | null>`
  - `listInvoices(userId): Promise<Array<{ id: string; invoiceNumber: string; clientCompany: string; editCount: number; updatedAt: Date }>>`

- [ ] **Step 1: Write the failing tests**

`tests/invoices/rules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isPaidEdit, nextPaidEdit } from '@/lib/invoices/rules';

describe('edit pricing', () => {
  it('charges every sixth edit only', () => {
    const paid = Array.from({ length: 19 }, (_, i) => i).filter(isPaidEdit);
    expect(paid).toEqual([6, 12, 18]);
  });

  it('reports the next paid edit number', () => {
    expect(nextPaidEdit(0)).toBe(6);
    expect(nextPaidEdit(5)).toBe(6);
    expect(nextPaidEdit(6)).toBe(12);
    expect(nextPaidEdit(11)).toBe(12);
  });
});
```

`tests/invoices/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { invoiceDataSchema } from '@/lib/validation';

const valid = () => ({ ...emptyInvoiceData(), invoiceNumber: 'INV-1' });

describe('invoiceDataSchema', () => {
  it('accepts a minimal invoice', () => {
    expect(invoiceDataSchema.safeParse(valid()).success).toBe(true);
  });

  it('requires an invoice number', () => {
    expect(invoiceDataSchema.safeParse({ ...valid(), invoiceNumber: '  ' }).success).toBe(false);
  });

  it('rejects oversized payloads', () => {
    const item = valid().items[0];
    const many = Array.from({ length: 101 }, () => ({ ...item }));
    expect(invoiceDataSchema.safeParse({ ...valid(), items: many }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), clientAddress: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('rejects negative or non-finite numbers and bad colors/fonts', () => {
    const item = valid().items[0];
    expect(invoiceDataSchema.safeParse({ ...valid(), items: [{ ...item, qty: -1 }] }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), items: [{ ...item, price: Number.NaN }] }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), primaryColor: 'red;}' }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), fontFamily: 'Comic Sans' }).success).toBe(false);
  });

  it('strips unknown keys', () => {
    const parsed = invoiceDataSchema.parse({ ...valid(), logoPath: '../../etc/passwd' });
    expect('logoPath' in parsed).toBe(false);
  });
});
```

`tests/invoices/service.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { invoices, tokenLedger, users } from '@/db/schema';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import {
  createInvoice,
  getInvoice,
  InvoiceNotFoundError,
  listInvoices,
  updateInvoice,
} from '@/lib/invoices/service';
import { OutOfTokensError } from '@/lib/tokens';
import { ledgerSum, makeUser, resetDb } from '../helpers/db';

const render = async () => Buffer.from('%PDF-stub');
const failingRender = async (): Promise<Buffer> => {
  throw new Error('render failed');
};
const data = (n = 'INV-1') => ({ ...emptyInvoiceData(), invoiceNumber: n });

async function balance(userId: string) {
  const [u] = await getDb().select().from(users).where(eq(users.id, userId));
  return u.tokenBalance;
}

describe('invoice service', () => {
  beforeEach(resetDb);

  it('charges one token to create', async () => {
    const user = await makeUser('a@example.com', { balance: 3 });
    const { id } = await createInvoice(user.id, data(), null, render);
    expect(await balance(user.id)).toBe(2);
    const ledger = await getDb().select().from(tokenLedger).where(eq(tokenLedger.invoiceId, id));
    expect(ledger.map((l) => [l.delta, l.reason])).toEqual([[-1, 'invoice_create']]);
    expect(await ledgerSum(user.id)).toBe(2);
  });

  it('refuses to create with zero balance and saves nothing', async () => {
    const user = await makeUser('a@example.com', { balance: 0 });
    await expect(createInvoice(user.id, data(), null, render)).rejects.toBeInstanceOf(OutOfTokensError);
    expect(await getDb().select().from(invoices)).toHaveLength(0);
  });

  it('rolls back the token when rendering fails', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    await expect(createInvoice(user.id, data(), null, failingRender)).rejects.toThrow('render failed');
    expect(await balance(user.id)).toBe(1);
    expect(await getDb().select().from(invoices)).toHaveLength(0);
  });

  it('makes edits 1-5 free, charges the 6th and 12th', async () => {
    const user = await makeUser('a@example.com', { balance: 3 });
    const { id } = await createInvoice(user.id, data(), null, render);
    const charged: boolean[] = [];
    for (let i = 1; i <= 12; i++) {
      const r = await updateInvoice(user.id, id, data(`INV-1-v${i}`), render);
      expect(r.editCount).toBe(i);
      charged.push(r.charged);
    }
    expect(charged.map((c, i) => (c ? i + 1 : 0)).filter(Boolean)).toEqual([6, 12]);
    expect(await balance(user.id)).toBe(0);
    expect(await ledgerSum(user.id)).toBe(0);
  });

  it('does not count saving unchanged data', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    const { id } = await createInvoice(user.id, data(), null, render);
    const r = await updateInvoice(user.id, id, data(), render);
    expect(r).toEqual({ unchanged: true, editCount: 0, charged: false });
  });

  it('blocks a paid edit at zero balance and keeps the old version', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    const { id } = await createInvoice(user.id, data(), null, render);
    for (let i = 1; i <= 5; i++) await updateInvoice(user.id, id, data(`v${i}`), render);
    await expect(updateInvoice(user.id, id, data('v6'), render)).rejects.toBeInstanceOf(OutOfTokensError);
    const inv = await getInvoice(user.id, id);
    expect(inv?.data.invoiceNumber).toBe('v5');
    expect(inv?.editCount).toBe(5);
  });

  it('lets exactly one of two concurrent paid edits through', async () => {
    const user = await makeUser('a@example.com', { balance: 2 });
    const a = await createInvoice(user.id, data('A'), null, render);
    const b = await createInvoice(user.id, data('B'), null, render);
    // balance now 0; top up to exactly 1 and bring both invoices to edit 5
    await getDb().update(users).set({ tokenBalance: 1 }).where(eq(users.id, user.id));
    await getDb().insert(tokenLedger).values({ userId: user.id, delta: 1, reason: 'admin_topup' });
    for (let i = 1; i <= 5; i++) {
      await updateInvoice(user.id, a.id, data(`A${i}`), render);
      await updateInvoice(user.id, b.id, data(`B${i}`), render);
    }
    const results = await Promise.allSettled([
      updateInvoice(user.id, a.id, data('A6'), render),
      updateInvoice(user.id, b.id, data('B6'), render),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await balance(user.id)).toBe(0);
    expect(await ledgerSum(user.id)).toBe(0);
  });

  it('hides other users invoices', async () => {
    const owner = await makeUser('a@example.com', { balance: 1 });
    const other = await makeUser('b@example.com', { balance: 1 });
    const { id } = await createInvoice(owner.id, data(), null, render);
    expect(await getInvoice(other.id, id)).toBeNull();
    expect(await getInvoice(owner.id, 'not-a-uuid')).toBeNull();
    await expect(updateInvoice(other.id, id, data('x'), render)).rejects.toBeInstanceOf(InvoiceNotFoundError);
    expect(await listInvoices(other.id)).toEqual([]);
    expect((await listInvoices(owner.id)).map((i) => i.id)).toEqual([id]);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/invoices`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

In `src/types/invoice.ts`, replace the `FontChoice` line with:

```ts
export const FONT_CHOICES = ['Caladea', 'Lato', 'Montserrat'] as const;
export type FontChoice = (typeof FONT_CHOICES)[number];
```

Append to `src/lib/validation.ts`:

```ts
import { FONT_CHOICES } from '@/types/invoice';

const text = (max = 200) => z.string().max(max);
const money = z.number().finite().min(0).max(1e13);

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const invoiceItemSchema = z.object({
  id: z.string().min(1).max(64),
  description: text(300),
  subDescription: text(500),
  spkRef: text(),
  qty: z.number().finite().min(0).max(1e6),
  unit: text(50),
  price: money,
});

export const invoiceDataSchema = z.object({
  fontFamily: z.enum(FONT_CHOICES),
  primaryColor: hexColor,
  senderName: text(),
  senderTitle: text(),
  senderLocation: text(),
  senderPhone: text(50),
  senderEmail: text(254),
  clientCompany: text(),
  clientPIC: text(),
  clientRole: text(),
  clientAddress: text(2000),
  clientEmail: text(254),
  invoiceNumber: z.string().trim().min(1).max(100),
  invoiceType: text(50),
  poRef: text(100),
  invoiceDate: text(50),
  dueDate: text(50),
  items: z.array(invoiceItemSchema).min(1).max(100),
  discount: money,
  taxRate: z.number().finite().min(0).max(100),
  bankName: text(100),
  accountNumber: text(50),
  accountHolder: text(),
});
```

(Move the new `import` to the top of the file next to the `zod` import.)

`src/lib/invoices/rules.ts`:

```ts
// One token buys a new invoice; after that every sixth saved edit costs one more.
export function isPaidEdit(editCount: number): boolean {
  return editCount > 0 && editCount % 6 === 0;
}

export function nextPaidEdit(editCount: number): number {
  return (Math.floor(editCount / 6) + 1) * 6;
}
```

`src/lib/invoices/empty.ts` (moved out of `InvoiceForm.tsx`; same values):

```ts
import type { InvoiceData, InvoiceItem } from '@/types/invoice';

export function newItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: '', subDescription: '', spkRef: '', qty: 1, unit: 'Package', price: 0 };
}

export function emptyInvoiceData(): InvoiceData {
  return {
    fontFamily: 'Caladea',
    primaryColor: '#1A3A5C',
    senderName: '', senderTitle: '', senderLocation: '', senderPhone: '', senderEmail: '',
    clientCompany: '', clientPIC: '', clientRole: '', clientAddress: '', clientEmail: '',
    invoiceNumber: '', invoiceType: 'DOWN PAYMENT', poRef: '',
    invoiceDate: '', dueDate: '',
    items: [newItem()],
    discount: 0, taxRate: 0,
    bankName: '', accountNumber: '', accountHolder: '',
  };
}
```

`src/lib/invoices/service.ts`:

```ts
import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { invoices, type Invoice } from '@/db/schema';
import { chargeToken } from '@/lib/tokens';
import { invoiceDataSchema } from '@/lib/validation';
import type { InvoiceData } from '@/types/invoice';
import { isPaidEdit } from './rules';

export type RenderPdf = (data: InvoiceData, logoPath: string | null) => Promise<Buffer>;

export class InvoiceNotFoundError extends Error {
  constructor() {
    super('Invoice not found');
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Re-parse through the schema so key order is canonical before comparing.
function sameData(a: InvoiceData, b: InvoiceData): boolean {
  return JSON.stringify(invoiceDataSchema.parse(a)) === JSON.stringify(invoiceDataSchema.parse(b));
}

export async function createInvoice(
  userId: string,
  data: InvoiceData,
  logoPath: string | null,
  render: RenderPdf,
): Promise<{ id: string }> {
  const id = randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(invoices).values({ id, userId, invoiceNumber: data.invoiceNumber, data, logoPath });
    await chargeToken(tx, userId, 'invoice_create', id);
    // Rendering inside the transaction means a broken PDF never costs a token.
    await render(data, logoPath);
  });
  return { id };
}

export async function updateInvoice(
  userId: string,
  id: string,
  data: InvoiceData,
  render: RenderPdf,
): Promise<{ unchanged: boolean; editCount: number; charged: boolean }> {
  if (!UUID_RE.test(id)) throw new InvoiceNotFoundError();
  return getDb().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .for('update');
    if (!current) throw new InvoiceNotFoundError();
    if (sameData(current.data, data)) {
      return { unchanged: true, editCount: current.editCount, charged: false };
    }
    const editCount = current.editCount + 1;
    await tx
      .update(invoices)
      .set({ data, invoiceNumber: data.invoiceNumber, editCount, updatedAt: new Date() })
      .where(eq(invoices.id, id));
    const charged = isPaidEdit(editCount);
    if (charged) await chargeToken(tx, userId, 'invoice_edit', id);
    await render(data, current.logoPath);
    return { unchanged: false, editCount, charged };
  });
}

export async function getInvoice(userId: string, id: string): Promise<Invoice | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await getDb()
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  return row ?? null;
}

export async function listInvoices(userId: string) {
  return getDb()
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      clientCompany: sql<string>`${invoices.data}->>'clientCompany'`,
      editCount: invoices.editCount,
      updatedAt: invoices.updatedAt,
    })
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/invoices`
Expected: all passed (2 rules + 5 validation + 8 service).

- [ ] **Step 5: Commit**

```bash
git add src/types/invoice.ts src/lib/validation.ts src/lib/invoices tests/invoices
git commit -m "feat: add invoice service with per-edit token pricing"
```

---

### Task 7: Mail, auth actions, auth pages and route protection

**Files:**
- Create: `src/lib/mail.ts`, `src/lib/auth/emails.ts`, `src/lib/auth/admin-emails.ts`, `src/lib/auth/current-user.ts`, `src/proxy.ts`, `src/app/(auth)/layout.tsx`, `src/app/(auth)/actions.ts`, `src/app/(auth)/forms.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/verify/page.tsx`, `src/app/(auth)/forgot/page.tsx`, `src/app/(auth)/reset/page.tsx`, `tests/auth/admin-emails.test.ts`

**Interfaces:**
- Consumes: Tasks 3, 4, 5.
- Produces:
  - `sendMail(msg: { to: string; subject: string; text: string }): Promise<void>`
  - `sendVerificationEmail(to, token)`, `sendResetEmail(to, token)`, `sendAccountExistsEmail(to)`
  - `isAdminEmail(email: string): boolean`
  - `getCurrentUser(): Promise<User | null>` (React `cache`), `requireUser()`, `requireVerifiedUser()`, `requireAdmin()`, `setSessionCookie(token, expiresAt)`, `clearSessionCookie()`
  - `type FormState = { error?: string; message?: string }`
  - Server actions: `registerAction`, `loginAction`, `verifyAction`, `resendVerificationAction`, `forgotAction`, `resetAction` (all `(prev: FormState, formData: FormData) => Promise<FormState>`), `logoutAction(): Promise<void>`

- [ ] **Step 1: Write the failing test for the only pure piece**

`tests/auth/admin-emails.test.ts` (`ADMIN_EMAILS=admin@example.com` comes from `vitest.config.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { isAdminEmail } from '@/lib/auth/admin-emails';

describe('isAdminEmail', () => {
  it('matches case-insensitively and ignores others', () => {
    expect(isAdminEmail('Admin@Example.com')).toBe(true);
    expect(isAdminEmail('user@example.com')).toBe(false);
  });
});
```

Run: `npx vitest run tests/auth/admin-emails.test.ts` → FAIL (module missing).

- [ ] **Step 2: Implement the library pieces**

`src/lib/auth/admin-emails.ts`:

```ts
export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}
```

`src/lib/mail.ts`:

```ts
import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  return (transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || '465'),
    secure: (process.env.SMTP_PORT || '465') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }));
}

// Without SMTP_HOST (local dev, E2E) mails are printed instead of sent.
export async function sendMail(msg: { to: string; subject: string; text: string }): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.info(`[mail:dev] to=${msg.to} subject=${msg.subject}\n${msg.text}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM ?? 'Bornworks Invoice <noreply@bornworks.biz.id>',
    ...msg,
  });
}
```

`src/lib/auth/emails.ts`:

```ts
import { sendMail } from '@/lib/mail';

const appUrl = () => process.env.APP_URL ?? 'http://localhost:3000';

export function sendVerificationEmail(to: string, token: string) {
  return sendMail({
    to,
    subject: 'Verify your email — Invoice PDF',
    text: `Confirm your email to get 10 free tokens:\n\n${appUrl()}/verify?token=${token}\n\nThis link expires in 1 hour.`,
  });
}

export function sendResetEmail(to: string, token: string) {
  return sendMail({
    to,
    subject: 'Reset your password — Invoice PDF',
    text: `Set a new password:\n\n${appUrl()}/reset?token=${token}\n\nThis link expires in 1 hour. If you did not ask for this, ignore this email.`,
  });
}

export function sendAccountExistsEmail(to: string) {
  return sendMail({
    to,
    subject: 'You already have an account — Invoice PDF',
    text: `Someone tried to register with this email, but it already has an account.\n\nLog in: ${appUrl()}/login\nForgot your password? ${appUrl()}/forgot`,
  });
}
```

`src/lib/auth/current-user.ts`:

```ts
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import type { User } from '@/db/schema';
import { isAdminEmail } from './admin-emails';
import { getUserBySessionToken, SESSION_COOKIE } from './session';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getUserBySessionToken(token) : null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireVerifiedUser(): Promise<User> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect('/verify');
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireVerifiedUser();
  if (!isAdminEmail(user.email)) notFound();
  return user;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
```

`src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';

// Optimistic gate only: pages and actions re-check the session against the database.
export function proxy(request: NextRequest) {
  if (request.cookies.has('session')) return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/invoices/:path*', '/settings/:path*', '/admin/:path*'],
};
```

Run: `npx vitest run tests/auth/admin-emails.test.ts` → PASS.

- [ ] **Step 3: Server actions**

`src/app/(auth)/actions.ts`:

```ts
'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { clearSessionCookie, requireUser, setSessionCookie } from '@/lib/auth/current-user';
import { issueEmailToken } from '@/lib/auth/email-tokens';
import { sendAccountExistsEmail, sendResetEmail, sendVerificationEmail } from '@/lib/auth/emails';
import { authenticate, registerUser, requestPasswordReset, resetPassword, verifyEmail } from '@/lib/auth/service';
import { createSession, deleteSession, SESSION_COOKIE } from '@/lib/auth/session';
import { hitRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { credentialsSchema, loginSchema } from '@/lib/validation';

export type FormState = { error?: string; message?: string };

const TOO_MANY = 'Too many attempts. Please try again later.';

async function allowed(kind: keyof typeof RATE_LIMITS, suffix: string) {
  const { limit, windowSeconds } = RATE_LIMITS[kind];
  return hitRateLimit(`${kind}:${suffix}`, limit, windowSeconds);
}

async function ip() {
  return getClientIp(await headers());
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Enter a valid email and a password of at least 8 characters.' };
  if (!(await allowed('register', await ip()))) return { error: TOO_MANY };

  const result = await registerUser(parsed.data.email, parsed.data.password);
  try {
    if (result.kind === 'created') await sendVerificationEmail(parsed.data.email, result.verifyToken);
    else await sendAccountExistsEmail(parsed.data.email);
  } catch (err) {
    console.error('[register] mail failed', { userId: result.userId, err });
  }
  // Same response whether or not the email was already registered.
  redirect('/verify?sent=1');
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Invalid email or password.' };
  if (!(await allowed('login', `${await ip()}:${parsed.data.email}`))) return { error: TOO_MANY };

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { error: 'Invalid email or password.' };
  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  redirect(user.emailVerifiedAt ? '/invoices' : '/verify');
}

export async function verifyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get('token') ?? '');
  const userId = token ? await verifyEmail(token) : null;
  if (!userId) return { error: 'This link is invalid or has expired. Log in to request a new one.' };
  const session = await createSession(userId);
  await setSessionCookie(session.token, session.expiresAt);
  redirect('/invoices');
}

export async function resendVerificationAction(_prev: FormState): Promise<FormState> {
  const user = await requireUser();
  if (user.emailVerifiedAt) redirect('/invoices');
  if (!(await allowed('resendVerification', user.id))) return { error: 'Please wait a minute before resending.' };
  try {
    await sendVerificationEmail(user.email, await issueEmailToken(user.id, 'verify'));
  } catch (err) {
    console.error('[resend-verification] mail failed', { userId: user.id, err });
    return { error: 'Could not send the email. Please try again.' };
  }
  return { message: 'Verification email sent.' };
}

export async function forgotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sent = { message: 'If that email is registered, a reset link is on its way.' };
  const parsed = loginSchema.shape.email.safeParse(formData.get('email'));
  if (!parsed.success) return { error: 'Enter a valid email.' };
  if (!(await allowed('forgot', await ip()))) return { error: TOO_MANY };
  const token = await requestPasswordReset(parsed.data);
  if (token) {
    try {
      await sendResetEmail(parsed.data, token);
    } catch (err) {
      console.error('[forgot] mail failed', { err });
    }
  }
  return sent;
}

export async function resetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get('token') ?? '');
  const password = credentialsSchema.shape.password.safeParse(formData.get('password'));
  if (!password.success) return { error: 'Password must be at least 8 characters.' };
  if (!token || !(await resetPassword(token, password.data))) {
    return { error: 'This link is invalid or has expired. Request a new one.' };
  }
  redirect('/login?reset=1');
}

export async function logoutAction(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  await clearSessionCookie();
  redirect('/login');
}
```

- [ ] **Step 4: Client forms and pages**

`src/app/(auth)/forms.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  forgotAction,
  loginAction,
  registerAction,
  resendVerificationAction,
  resetAction,
  verifyAction,
  type FormState,
} from './actions';

const input =
  'w-full border border-[#BCC6B6] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5C42]/30';
const button =
  'w-full py-2.5 rounded-md bg-[#0B5C42] text-[#F6F7F1] font-mono text-[13px] font-bold tracking-tight hover:bg-[#094B36] disabled:opacity-50';
const label = 'block font-mono text-[10px] font-bold text-[#5C6A5E] mb-1.5 uppercase tracking-[0.14em]';

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state.message) return <p className="text-sm text-[#0B5C42]">{state.message}</p>;
  return null;
}

function EmailField() {
  return (
    <div>
      <label htmlFor="email" className={label}>Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required className={input} />
    </div>
  );
}

function PasswordField({ autoComplete, label: text = 'Password' }: { autoComplete: string; label?: string }) {
  return (
    <div>
      <label htmlFor="password" className={label}>{text}</label>
      <input id="password" name="password" type="password" autoComplete={autoComplete} minLength={8} required className={input} />
    </div>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <EmailField />
      <PasswordField autoComplete="current-password" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SIGNING IN…' : 'SIGN IN'}</button>
      <div className="flex justify-between text-sm text-[#5C6A5E]">
        <Link href="/register" className="hover:text-[#19261F]">Create account</Link>
        <Link href="/forgot" className="hover:text-[#19261F]">Forgot password?</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <EmailField />
      <PasswordField autoComplete="new-password" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'CREATING…' : 'CREATE ACCOUNT'}</button>
      <p className="text-sm text-[#5C6A5E]">
        Already registered? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </form>
  );
}

export function VerifyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'VERIFYING…' : 'VERIFY EMAIL'}</button>
    </form>
  );
}

export function ResendVerificationButton() {
  const [state, action, pending] = useActionState(resendVerificationAction, {});
  return (
    <form action={action} className="space-y-3">
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SENDING…' : 'RESEND EMAIL'}</button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotAction, {});
  return (
    <form action={action} className="space-y-4">
      <EmailField />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SENDING…' : 'SEND RESET LINK'}</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <PasswordField autoComplete="new-password" label="New password" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SAVING…' : 'SET PASSWORD'}</button>
    </form>
  );
}
```

`src/app/(auth)/layout.tsx`:

```tsx
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#E7EBE2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-mono text-sm font-bold tracking-tight text-[#19261F] mb-6">
          INVOICE<span className="text-[#0B5C42]">·</span>PDF
        </Link>
        <div className="bg-white rounded-lg border border-[#C9D1C2] p-6">{children}</div>
      </div>
    </main>
  );
}
```

`src/app/(auth)/login/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { LoginForm } from '../forms';

export const metadata = { title: 'Sign in — Invoice PDF' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getCurrentUser()) redirect('/invoices');
  const { reset } = await searchParams;
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-4">Sign in</h1>
      {reset && <p className="text-sm text-[#0B5C42] mb-4">Password updated. Sign in with your new password.</p>}
      <LoginForm />
    </>
  );
}
```

`src/app/(auth)/register/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { RegisterForm } from '../forms';

export const metadata = { title: 'Create account — Invoice PDF' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/invoices');
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-1">Create account</h1>
      <p className="text-sm text-[#5C6A5E] mb-4">Verify your email to get 10 free tokens.</p>
      <RegisterForm />
    </>
  );
}
```

`src/app/(auth)/verify/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { logoutAction } from '../actions';
import { getCurrentUser } from '@/lib/auth/current-user';
import { ResendVerificationButton, VerifyForm } from '../forms';

export const metadata = { title: 'Verify email — Invoice PDF' };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (token) {
    return (
      <>
        <h1 className="text-lg font-semibold text-[#19261F] mb-4">Confirm your email</h1>
        <VerifyForm token={token} />
      </>
    );
  }
  const user = await getCurrentUser();
  if (user?.emailVerifiedAt) redirect('/invoices');
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-2">Check your email</h1>
      <p className="text-sm text-[#5C6A5E] mb-4">
        We sent a verification link{user ? ` to ${user.email}` : ''}. It expires in 1 hour.
      </p>
      {user && (
        <div className="space-y-3">
          <ResendVerificationButton />
          <form action={logoutAction}>
            <button className="w-full text-sm text-[#5C6A5E] hover:text-[#19261F]">Sign out</button>
          </form>
        </div>
      )}
    </>
  );
}
```

`src/app/(auth)/forgot/page.tsx`:

```tsx
import { ForgotForm } from '../forms';

export const metadata = { title: 'Forgot password — Invoice PDF' };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-4">Reset your password</h1>
      <ForgotForm />
    </>
  );
}
```

`src/app/(auth)/reset/page.tsx`:

```tsx
import { ResetForm } from '../forms';

export const metadata = { title: 'Set new password — Invoice PDF' };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-4">Set a new password</h1>
      {token ? <ResetForm token={token} /> : <p className="text-sm text-red-700">Missing reset token.</p>}
    </>
  );
}
```

- [ ] **Step 5: Verify types, lint and build**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint errors, all tests pass. (Full build is verified in Task 11; pages are exercised end-to-end in Task 12.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/mail.ts src/lib/auth src/proxy.ts "src/app/(auth)" tests/auth/admin-emails.test.ts
git commit -m "feat: add register, verify, login, and password reset flows"
```

---

### Task 8: Settings, logo storage and PDF logo

**Files:**
- Create: `src/lib/invoices/style.ts`, `src/lib/logo.ts`, `src/lib/settings.ts`, `src/lib/pdf.ts`, `src/app/(app)/settings/page.tsx`, `src/app/(app)/settings/actions.ts`, `src/app/(app)/settings/settings-form.tsx`, `src/app/(app)/settings/logo/route.ts`, `tests/logo.test.ts`, `tests/settings.test.ts`, `tests/pdf.test.ts`
- Modify: `src/lib/validation.ts` (append `settingsSchema`), `src/components/pdf/InvoicePDF.tsx` (logo prop)

**Interfaces:**
- Consumes: `requireVerifiedUser`, `changePassword`, `FormState` shape (Task 7); `hexColor`, `FONT_CHOICES` (Task 6).
- Produces:
  - `FONTS`, `FONT_CSS`, `COLOR_PRESETS` (moved from `InvoiceForm.tsx`)
  - `MAX_LOGO_BYTES = 500 * 1024`, `class InvalidLogoError extends Error`, `detectImageFormat(buf: Buffer): 'png' | 'jpg' | null`, `saveLogo(userId: string, buf: Buffer): Promise<string>` (relative path), `readLogo(relPath: string | null): Promise<{ data: Buffer; format: 'png' | 'jpg' } | null>`
  - `type UserSettingsInput` (zod output of `settingsSchema`), `getSettings(userId): Promise<UserSettingsInput & { logoPath: string | null }>`, `saveSettings(userId, input)`, `setLogoPath(userId, relPath | null)`, `settingsToInvoiceDefaults(settings): Partial<InvoiceData>`
  - `renderInvoicePdf(data: InvoiceData, logo: { data: Buffer; format: 'png' | 'jpg' } | null): Promise<Buffer>`
  - `InvoicePDF` props: `{ data: InvoiceData; logo?: { data: Buffer; format: 'png' | 'jpg' } | null }`

- [ ] **Step 1: Write the failing tests**

`tests/logo.test.ts`:

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { detectImageFormat, InvalidLogoError, MAX_LOGO_BYTES, readLogo, saveLogo } from '@/lib/logo';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const USER = '11111111-1111-1111-1111-111111111111';

describe('logo storage', () => {
  beforeEach(async () => {
    await fs.rm(process.env.UPLOAD_DIR!, { recursive: true, force: true });
  });

  it('detects formats from magic bytes', () => {
    expect(detectImageFormat(PNG)).toBe('png');
    expect(detectImageFormat(JPG)).toBe('jpg');
    expect(detectImageFormat(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
  });

  it('rejects non-image bytes', async () => {
    await expect(saveLogo(USER, Buffer.from('<html></html>'))).rejects.toBeInstanceOf(InvalidLogoError);
  });

  it('rejects files over the size limit', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_LOGO_BYTES)]);
    await expect(saveLogo(USER, big)).rejects.toBeInstanceOf(InvalidLogoError);
  });

  it('old logo file survives replacement', async () => {
    const first = await saveLogo(USER, PNG);
    const second = await saveLogo(USER, JPG);
    expect(first).not.toBe(second);
    expect((await readLogo(first))?.format).toBe('png');
    expect((await readLogo(second))?.format).toBe('jpg');
    expect(second.startsWith(`${USER}/logo-`)).toBe(true);
  });

  it('refuses paths that were not produced by saveLogo', async () => {
    await fs.mkdir(path.join(process.env.UPLOAD_DIR!), { recursive: true });
    expect(await readLogo('../package.json')).toBeNull();
    expect(await readLogo(null)).toBeNull();
  });
});
```

`tests/settings.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { getSettings, saveSettings, setLogoPath, settingsToInvoiceDefaults } from '@/lib/settings';
import { makeUser, resetDb } from './helpers/db';

const input = {
  fontFamily: 'Lato' as const,
  primaryColor: '#334155',
  senderName: 'Ada', senderTitle: 'Dev', senderLocation: 'Jakarta', senderPhone: '0812', senderEmail: 'ada@x.co',
  bankName: 'BCA', accountNumber: '123', accountHolder: 'Ada',
};

describe('settings', () => {
  beforeEach(resetDb);

  it('returns defaults before anything is saved', async () => {
    const user = await makeUser();
    const s = await getSettings(user.id);
    expect(s.fontFamily).toBe('Caladea');
    expect(s.logoPath).toBeNull();
  });

  it('saves per user without touching others', async () => {
    const a = await makeUser('a@example.com');
    const b = await makeUser('b@example.com');
    await saveSettings(a.id, input);
    await setLogoPath(a.id, `${a.id}/logo-x.png`);
    expect((await getSettings(a.id)).senderName).toBe('Ada');
    expect((await getSettings(a.id)).logoPath).toBe(`${a.id}/logo-x.png`);
    expect((await getSettings(b.id)).senderName).toBe('');
  });

  it('maps settings to invoice defaults', async () => {
    const user = await makeUser();
    await saveSettings(user.id, input);
    const d = settingsToInvoiceDefaults(await getSettings(user.id));
    expect(d).toMatchObject({ fontFamily: 'Lato', primaryColor: '#334155', senderName: 'Ada', bankName: 'BCA' });
    expect('logoPath' in d).toBe(false);
  });
});
```

`tests/pdf.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { renderInvoicePdf } from '@/lib/pdf';

// Valid 1x1 PNG.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('renderInvoicePdf', () => {
  it('renders a PDF without a logo', async () => {
    const buf = await renderInvoicePdf({ ...emptyInvoiceData(), invoiceNumber: 'INV-1' }, null);
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('renders a PDF with a PNG logo', async () => {
    const buf = await renderInvoicePdf(
      { ...emptyInvoiceData(), invoiceNumber: 'INV-1' },
      { data: PNG_1x1, format: 'png' },
    );
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/logo.test.ts tests/settings.test.ts tests/pdf.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/invoices/style.ts` (cut these three constants out of `InvoiceForm.tsx` unchanged, export them):

```ts
import type { FontChoice } from '@/types/invoice';

export const FONTS: { value: FontChoice; label: string; desc: string }[] = [
  { value: 'Caladea',    label: 'Caladea',    desc: 'Serif' },
  { value: 'Lato',       label: 'Lato',       desc: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', desc: 'Geometric' },
];

export const FONT_CSS: Record<FontChoice, string> = {
  Caladea:    "'Caladea', 'Cambria', Georgia, serif",
  Lato:       "'Lato', Arial, sans-serif",
  Montserrat: "'Montserrat', Arial, sans-serif",
};

export const COLOR_PRESETS = [
  { label: 'Navy',    value: '#1A3A5C' },
  { label: 'Forest',  value: '#1A6B3C' },
  { label: 'Indigo',  value: '#3730A3' },
  { label: 'Violet',  value: '#6D28D9' },
  { label: 'Rose',    value: '#BE123C' },
  { label: 'Amber',   value: '#B45309' },
  { label: 'Slate',   value: '#334155' },
];
```

Append to `src/lib/validation.ts`:

```ts
export const settingsSchema = z.object({
  fontFamily: z.enum(FONT_CHOICES),
  primaryColor: hexColor,
  senderName: text(),
  senderTitle: text(),
  senderLocation: text(),
  senderPhone: text(50),
  senderEmail: text(254),
  bankName: text(100),
  accountNumber: text(50),
  accountHolder: text(),
});

export type UserSettingsInput = z.infer<typeof settingsSchema>;
```

`src/lib/logo.ts`:

```ts
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const MAX_LOGO_BYTES = 500 * 1024;

export class InvalidLogoError extends Error {}

const uploadDir = () => process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const REL_PATH_RE = /^[0-9a-f-]{36}\/logo-[0-9a-f-]{36}\.(png|jpg)$/;

export function detectImageFormat(buf: Buffer): 'png' | 'jpg' | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  return null;
}

// Every upload gets a new file name so invoices keep the logo they were made with.
// ponytail: old logo files are never deleted; add cleanup if uploads/ grows noticeably.
export async function saveLogo(userId: string, buf: Buffer): Promise<string> {
  if (buf.length > MAX_LOGO_BYTES) throw new InvalidLogoError('Logo must be 500 KB or smaller.');
  const format = detectImageFormat(buf);
  if (!format) throw new InvalidLogoError('Logo must be a PNG or JPEG image.');
  const relPath = `${userId}/logo-${randomUUID()}.${format}`;
  await fs.mkdir(path.join(uploadDir(), userId), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), relPath), buf);
  return relPath;
}

export async function readLogo(relPath: string | null): Promise<{ data: Buffer; format: 'png' | 'jpg' } | null> {
  if (!relPath || !REL_PATH_RE.test(relPath)) return null;
  try {
    const data = await fs.readFile(path.join(uploadDir(), relPath));
    const format = detectImageFormat(data);
    return format ? { data, format } : null;
  } catch {
    return null;
  }
}
```

`src/lib/settings.ts`:

```ts
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { userSettings } from '@/db/schema';
import type { UserSettingsInput } from '@/lib/validation';
import type { FontChoice, InvoiceData } from '@/types/invoice';

export type UserSettings = UserSettingsInput & { logoPath: string | null };

const DEFAULTS: UserSettings = {
  fontFamily: 'Caladea',
  primaryColor: '#1A3A5C',
  logoPath: null,
  senderName: '', senderTitle: '', senderLocation: '', senderPhone: '', senderEmail: '',
  bankName: '', accountNumber: '', accountHolder: '',
};

export async function getSettings(userId: string): Promise<UserSettings> {
  const [row] = await getDb().select().from(userSettings).where(eq(userSettings.userId, userId));
  if (!row) return { ...DEFAULTS };
  return {
    fontFamily: row.fontFamily as FontChoice,
    primaryColor: row.primaryColor,
    logoPath: row.logoPath,
    senderName: row.senderName,
    senderTitle: row.senderTitle,
    senderLocation: row.senderLocation,
    senderPhone: row.senderPhone,
    senderEmail: row.senderEmail,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    accountHolder: row.accountHolder,
  };
}

export async function saveSettings(userId: string, input: UserSettingsInput): Promise<void> {
  await getDb()
    .insert(userSettings)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: userSettings.userId, set: { ...input, updatedAt: new Date() } });
}

export async function setLogoPath(userId: string, logoPath: string | null): Promise<void> {
  await getDb()
    .insert(userSettings)
    .values({ userId, logoPath })
    .onConflictDoUpdate({ target: userSettings.userId, set: { logoPath, updatedAt: new Date() } });
}

export function settingsToInvoiceDefaults(s: UserSettings): Partial<InvoiceData> {
  return {
    fontFamily: s.fontFamily,
    primaryColor: s.primaryColor,
    senderName: s.senderName,
    senderTitle: s.senderTitle,
    senderLocation: s.senderLocation,
    senderPhone: s.senderPhone,
    senderEmail: s.senderEmail,
    bankName: s.bankName,
    accountNumber: s.accountNumber,
    accountHolder: s.accountHolder,
  };
}
```

`src/lib/pdf.ts`:

```ts
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';
import type { InvoiceData } from '@/types/invoice';

export async function renderInvoicePdf(
  data: InvoiceData,
  logo: { data: Buffer; format: 'png' | 'jpg' } | null,
): Promise<Buffer> {
  const element = React.createElement(InvoicePDF, { data, logo }) as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
```

`src/components/pdf/InvoicePDF.tsx` — three edits:

1. Import `Image`: change line 3 to
   `import { Document, Page, View, Text, Font, Image } from '@react-pdf/renderer';`
2. Add to the object returned by `buildStyles`, right after `hRight`:
   ```ts
       logo:       { height: 40, maxWidth: 160, objectFit: 'contain' as const, marginBottom: 6 },
   ```
3. Change the component signature and the left header block:
   ```tsx
   export function InvoicePDF({ data, logo }: { data: InvoiceData; logo?: { data: Buffer; format: 'png' | 'jpg' } | null }) {
   ```
   and inside `<View style={s.hLeft}>`, before the sender name `Text`:
   ```tsx
               {logo ? <Image src={logo} style={s.logo} /> : null}
   ```

`src/app/(app)/settings/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import type { FormState } from '@/app/(auth)/actions';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { changePassword } from '@/lib/auth/service';
import { InvalidLogoError, saveLogo } from '@/lib/logo';
import { saveSettings, setLogoPath } from '@/lib/settings';
import { credentialsSchema, settingsSchema } from '@/lib/validation';

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireVerifiedUser();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Some fields are invalid. Check the color and lengths.' };
  await saveSettings(user.id, parsed.data);
  revalidatePath('/settings');
  return { message: 'Settings saved.' };
}

export async function uploadLogoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireVerifiedUser();
  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image first.' };
  try {
    await setLogoPath(user.id, await saveLogo(user.id, Buffer.from(await file.arrayBuffer())));
  } catch (err) {
    if (err instanceof InvalidLogoError) return { error: err.message };
    throw err;
  }
  revalidatePath('/settings');
  return { message: 'Logo updated. New invoices will use it.' };
}

export async function removeLogoAction(_prev: FormState): Promise<FormState> {
  const user = await requireVerifiedUser();
  await setLogoPath(user.id, null);
  revalidatePath('/settings');
  return { message: 'Logo removed.' };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireVerifiedUser();
  const next = credentialsSchema.shape.password.safeParse(formData.get('newPassword'));
  if (!next.success) return { error: 'New password must be at least 8 characters.' };
  const ok = await changePassword(user.id, String(formData.get('currentPassword') ?? ''), next.data);
  return ok ? { message: 'Password changed.' } : { error: 'Current password is wrong.' };
}
```

`src/app/(app)/settings/settings-form.tsx`:

```tsx
'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/app/(auth)/actions';
import { COLOR_PRESETS, FONT_CSS, FONTS } from '@/lib/invoices/style';
import type { UserSettings } from '@/lib/settings';
import { changePasswordAction, removeLogoAction, saveSettingsAction, uploadLogoAction } from './actions';

const card = 'bg-white rounded-lg border border-[#C9D1C2] p-5 space-y-4';
const input =
  'w-full border border-[#BCC6B6] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5C42]/30';
const label = 'block font-mono text-[10px] font-bold text-[#5C6A5E] mb-1.5 uppercase tracking-[0.14em]';
const button =
  'px-4 py-2 rounded-md bg-[#0B5C42] text-[#F6F7F1] font-mono text-[13px] font-bold hover:bg-[#094B36] disabled:opacity-50';

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state.message) return <p className="text-sm text-[#0B5C42]">{state.message}</p>;
  return null;
}

const TEXT_FIELDS: { name: keyof UserSettings; label: string }[] = [
  { name: 'senderName', label: 'Sender name' },
  { name: 'senderTitle', label: 'Title / position' },
  { name: 'senderLocation', label: 'City / location' },
  { name: 'senderPhone', label: 'Phone' },
  { name: 'senderEmail', label: 'Email' },
  { name: 'bankName', label: 'Bank' },
  { name: 'accountNumber', label: 'Account number' },
  { name: 'accountHolder', label: 'Account holder' },
];

export function SettingsForm({ settings, logoVersion }: { settings: UserSettings; logoVersion: string | null }) {
  const [saveState, saveAction, saving] = useActionState(saveSettingsAction, {});
  const [logoState, logoAction, uploading] = useActionState(uploadLogoAction, {});
  const [removeState, removeAction] = useActionState(removeLogoAction, {});
  const [pwState, pwAction, changing] = useActionState(changePasswordAction, {});
  const [font, setFont] = useState(settings.fontFamily);
  const [color, setColor] = useState(settings.primaryColor);

  return (
    <div className="space-y-5">
      <form action={saveAction} className={card}>
        <h2 className="font-semibold text-[#19261F]">Invoice style & defaults</h2>
        <input type="hidden" name="fontFamily" value={font} />
        <input type="hidden" name="primaryColor" value={color} />
        <div>
          <p className={label}>PDF font</p>
          <div className="flex gap-2 flex-wrap">
            {FONTS.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setFont(f.value)}
                className="px-4 py-2 rounded-lg border-2 text-sm"
                style={{ fontFamily: FONT_CSS[f.value], borderColor: font === f.value ? '#0B5C42' : '#C9D1C2' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={label}>PDF color</p>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                type="button"
                key={c.value}
                title={c.label}
                onClick={() => setColor(c.value)}
                className="w-7 h-7 rounded-full"
                style={{ backgroundColor: c.value, outline: color === c.value ? `3px solid ${c.value}` : 'none', outlineOffset: 2 }}
              />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} aria-label="Custom color" />
            <span className="text-xs font-mono text-[#8A9587]">{color}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {TEXT_FIELDS.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className={label}>{f.label}</label>
              <input id={f.name} name={f.name} defaultValue={String(settings[f.name] ?? '')} className={input} />
            </div>
          ))}
        </div>
        <Feedback state={saveState} />
        <button disabled={saving} className={button}>{saving ? 'SAVING…' : 'SAVE'}</button>
      </form>

      <div className={card}>
        <h2 className="font-semibold text-[#19261F]">Logo</h2>
        {logoVersion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/settings/logo?v=${logoVersion}`} alt="Current logo" className="h-12 object-contain" />
        ) : (
          <p className="text-sm text-[#5C6A5E]">No logo yet.</p>
        )}
        <form action={logoAction} className="flex items-center gap-3 flex-wrap">
          <input type="file" name="logo" accept="image/png,image/jpeg" className="text-sm" />
          <button disabled={uploading} className={button}>{uploading ? 'UPLOADING…' : 'UPLOAD'}</button>
        </form>
        <p className="text-xs text-[#8A9587]">PNG or JPEG, max 500 KB. Existing invoices keep their old logo.</p>
        <Feedback state={logoState} />
        {logoVersion && (
          <form action={removeAction}>
            <button className="text-sm text-[#5C6A5E] hover:text-red-700">Remove logo</button>
            <Feedback state={removeState} />
          </form>
        )}
      </div>

      <form action={pwAction} className={card}>
        <h2 className="font-semibold text-[#19261F]">Change password</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="currentPassword" className={label}>Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className={input} />
          </div>
          <div>
            <label htmlFor="newPassword" className={label}>New password</label>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required className={input} />
          </div>
        </div>
        <Feedback state={pwState} />
        <button disabled={changing} className={button}>{changing ? 'SAVING…' : 'CHANGE PASSWORD'}</button>
      </form>
    </div>
  );
}
```

`src/app/(app)/settings/page.tsx`:

```tsx
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { getSettings } from '@/lib/settings';
import { SettingsForm } from './settings-form';

export const metadata = { title: 'Settings — Invoice PDF' };

export default async function SettingsPage() {
  const user = await requireVerifiedUser();
  const settings = await getSettings(user.id);
  // The file name changes on every upload, so it doubles as a cache-buster.
  const logoVersion = settings.logoPath?.split('/').pop() ?? null;
  return <SettingsForm settings={settings} logoVersion={logoVersion} />;
}
```

`src/app/(app)/settings/logo/route.ts`:

```ts
import { getCurrentUser } from '@/lib/auth/current-user';
import { readLogo } from '@/lib/logo';
import { getSettings } from '@/lib/settings';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return new Response('Unauthorized', { status: 401 });
  const logo = await readLogo((await getSettings(user.id)).logoPath);
  if (!logo) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      'Content-Type': logo.format === 'png' ? 'image/png' : 'image/jpeg',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/logo.test.ts tests/settings.test.ts tests/pdf.test.ts && npx tsc --noEmit`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/invoices/style.ts src/lib/logo.ts src/lib/settings.ts src/lib/pdf.ts src/lib/validation.ts src/components/pdf/InvoicePDF.tsx "src/app/(app)/settings" tests/logo.test.ts tests/settings.test.ts tests/pdf.test.ts
git commit -m "feat: add per-user invoice settings and logo"
```

---

### Task 9: Templates, invoice pages and server-backed form

**Files:**
- Create: `src/lib/templates.ts`, `src/app/(app)/layout.tsx`, `src/app/(app)/invoices/page.tsx`, `src/app/(app)/invoices/actions.ts`, `src/app/(app)/invoices/new/page.tsx`, `src/app/(app)/invoices/[id]/page.tsx`, `src/app/(app)/invoices/[id]/pdf/route.ts`, `tests/templates.test.ts`
- Modify: `src/components/InvoiceForm.tsx`, `src/app/generator/page.tsx`, `src/app/page.tsx` (3 links)
- Delete: `src/app/api/generate-pdf/route.ts`, `public/music/Beautiful In White.mp3`

**Interfaces:**
- Consumes: Tasks 6, 7, 8.
- Produces:
  - `type SavedTemplate = { id: string; name: string; data: InvoiceData }`
  - `listTemplates(userId): Promise<SavedTemplate[]>`, `saveTemplate(userId, name, data): Promise<void>`, `deleteTemplate(userId, id): Promise<void>`
  - Actions: `createInvoiceAction(input: unknown): Promise<SaveResult>`, `updateInvoiceAction(id: string, input: unknown): Promise<SaveResult>`, `saveTemplateAction(name: string, input: unknown): Promise<TemplateResult>`, `deleteTemplateAction(id: string): Promise<TemplateResult>`
  - `type SaveResult = { ok: true; id: string; editCount: number; charged: boolean; unchanged: boolean } | { ok: false; error: string }`
  - `type TemplateResult = { ok: true; templates: SavedTemplate[] } | { ok: false; error: string }`
  - `InvoiceForm` props: `{ mode: 'new' | 'edit'; invoiceId?: string; editCount?: number; initialData: InvoiceData; templates: SavedTemplate[] }`

- [ ] **Step 1: Write the failing test**

`tests/templates.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { deleteTemplate, listTemplates, saveTemplate } from '@/lib/templates';
import { makeUser, resetDb } from './helpers/db';

describe('templates', () => {
  beforeEach(resetDb);

  it('are private to their owner', async () => {
    const a = await makeUser('a@example.com');
    const b = await makeUser('b@example.com');
    await saveTemplate(a.id, 'Retainer', { ...emptyInvoiceData(), invoiceNumber: 'T-1' });
    const [tpl] = await listTemplates(a.id);
    expect(tpl.name).toBe('Retainer');
    expect(await listTemplates(b.id)).toEqual([]);

    await deleteTemplate(b.id, tpl.id);
    expect(await listTemplates(a.id)).toHaveLength(1);
    await deleteTemplate(a.id, tpl.id);
    expect(await listTemplates(a.id)).toEqual([]);
  });
});
```

Run: `npx vitest run tests/templates.test.ts` → FAIL (module missing).

- [ ] **Step 2: Implement `src/lib/templates.ts`**

```ts
import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { templates } from '@/db/schema';
import type { InvoiceData } from '@/types/invoice';

export type SavedTemplate = { id: string; name: string; data: InvoiceData };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listTemplates(userId: string): Promise<SavedTemplate[]> {
  return getDb()
    .select({ id: templates.id, name: templates.name, data: templates.data })
    .from(templates)
    .where(eq(templates.userId, userId))
    .orderBy(asc(templates.createdAt));
}

export async function saveTemplate(userId: string, name: string, data: InvoiceData): Promise<void> {
  await getDb().insert(templates).values({ userId, name, data });
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  await getDb().delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
}
```

Run: `npx vitest run tests/templates.test.ts` → PASS.

- [ ] **Step 3: Invoice and template actions**

`src/app/(app)/invoices/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { createInvoice, InvoiceNotFoundError, updateInvoice, type RenderPdf } from '@/lib/invoices/service';
import { readLogo } from '@/lib/logo';
import { renderInvoicePdf } from '@/lib/pdf';
import { getSettings } from '@/lib/settings';
import { deleteTemplate, listTemplates, saveTemplate, type SavedTemplate } from '@/lib/templates';
import { OutOfTokensError } from '@/lib/tokens';
import { invoiceDataSchema } from '@/lib/validation';

export type SaveResult =
  | { ok: true; id: string; editCount: number; charged: boolean; unchanged: boolean }
  | { ok: false; error: string };

export type TemplateResult = { ok: true; templates: SavedTemplate[] } | { ok: false; error: string };

const OUT_OF_TOKENS = 'You are out of tokens. Ask an admin to top up your balance.';
const GENERIC = 'Something went wrong. Please try again.';

const render: RenderPdf = async (data, logoPath) => renderInvoicePdf(data, await readLogo(logoPath));

function invalid(error: z.ZodError): { ok: false; error: string } {
  const issue = error.issues[0];
  return { ok: false, error: `Invalid field "${issue.path.join('.')}": ${issue.message}` };
}

export async function createInvoiceAction(input: unknown): Promise<SaveResult> {
  const user = await requireVerifiedUser();
  const parsed = invoiceDataSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { logoPath } = await getSettings(user.id);
    const { id } = await createInvoice(user.id, parsed.data, logoPath, render);
    revalidatePath('/', 'layout');
    return { ok: true, id, editCount: 0, charged: true, unchanged: false };
  } catch (err) {
    if (err instanceof OutOfTokensError) return { ok: false, error: OUT_OF_TOKENS };
    console.error('[createInvoice]', { userId: user.id, err });
    return { ok: false, error: GENERIC };
  }
}

export async function updateInvoiceAction(id: string, input: unknown): Promise<SaveResult> {
  const user = await requireVerifiedUser();
  const parsed = invoiceDataSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const r = await updateInvoice(user.id, id, parsed.data, render);
    revalidatePath('/', 'layout');
    return { ok: true, id, ...r };
  } catch (err) {
    if (err instanceof OutOfTokensError) return { ok: false, error: OUT_OF_TOKENS };
    if (err instanceof InvoiceNotFoundError) return { ok: false, error: 'Invoice not found.' };
    console.error('[updateInvoice]', { userId: user.id, invoiceId: id, err });
    return { ok: false, error: GENERIC };
  }
}

export async function saveTemplateAction(name: string, input: unknown): Promise<TemplateResult> {
  const user = await requireVerifiedUser();
  const parsedName = z.string().trim().min(1).max(100).safeParse(name);
  // Templates may be saved before an invoice number exists, so relax only that field.
  const parsed = invoiceDataSchema.extend({ invoiceNumber: z.string().max(100) }).safeParse(input);
  if (!parsedName.success) return { ok: false, error: 'Template name is required.' };
  if (!parsed.success) return invalid(parsed.error);
  await saveTemplate(user.id, parsedName.data, parsed.data);
  return { ok: true, templates: await listTemplates(user.id) };
}

export async function deleteTemplateAction(id: string): Promise<TemplateResult> {
  const user = await requireVerifiedUser();
  await deleteTemplate(user.id, id);
  return { ok: true, templates: await listTemplates(user.id) };
}
```

- [ ] **Step 4: Refactor `src/components/InvoiceForm.tsx`**

Make exactly these changes (the rest of the JSX — sections, fields, items table, totals — stays as is):

1. Replace the imports block (lines 1–7) with:
   ```tsx
   'use client';

   import { useState, useCallback } from 'react';
   import Link from 'next/link';
   import { useRouter } from 'next/navigation';
   import { ArrowLeft, Download, Plus, X, Save, ChevronDown, Trash2 } from 'lucide-react';
   import { InvoiceData, InvoiceItem } from '@/types/invoice';
   import { calcSubtotal, calcTax, calcTotal, formatCurrency } from '@/lib/format';
   import { newItem } from '@/lib/invoices/empty';
   import { nextPaidEdit } from '@/lib/invoices/rules';
   import { COLOR_PRESETS, FONT_CSS, FONTS } from '@/lib/invoices/style';
   import type { SavedTemplate } from '@/lib/templates';
   import { createInvoiceAction, deleteTemplateAction, saveTemplateAction, updateInvoiceAction } from '@/app/(app)/invoices/actions';
   ```
2. Delete the local `FONTS`, `FONT_CSS`, `COLOR_PRESETS` constants, the local `SavedTemplate` interface, `LS_KEY`, and the local `emptyData()` and `newItem()` functions (now imported). Keep `INVOICE_TYPES`, `TPL_A`…`TPL_C`, `BUILTIN_TEMPLATES`, `cloneTemplate`.
3. Replace the component head (from `export function InvoiceForm() {` through the end of `deleteTemplate`) with:
   ```tsx
   type Props = {
     mode: 'new' | 'edit';
     invoiceId?: string;
     editCount?: number;
     initialData: InvoiceData;
     templates: SavedTemplate[];
   };

   export function InvoiceForm({ mode, invoiceId, editCount: initialEditCount = 0, initialData, templates }: Props) {
     const router = useRouter();
     const [data, setData]                   = useState<InvoiceData>(initialData);
     const [currentId, setCurrentId]         = useState<string | undefined>(mode === 'edit' ? invoiceId : undefined);
     const [editCount, setEditCount]         = useState(initialEditCount);
     const [loading, setLoading]             = useState(false);
     const [error, setError]                 = useState<string | null>(null);
     const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(templates);
     const [saveMode, setSaveMode]           = useState(false);
     const [saveName, setSaveName]           = useState('');
     const [templateOpen, setTemplateOpen]   = useState(false);

     const set = useCallback(<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
       setData(prev => ({ ...prev, [key]: value }));
     }, []);

     const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
       setData(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, [field]: value } : i) }));
     }, []);

     function loadTemplate(tplData: InvoiceData) {
       setData(cloneTemplate(tplData));
       setTemplateOpen(false);
     }

     async function handleSave() {
       if (!saveName.trim()) return;
       const result = await saveTemplateAction(saveName.trim(), data);
       if (!result.ok) { setError(result.error); return; }
       setSavedTemplates(result.templates);
       setSaveMode(false);
       setSaveName('');
     }

     async function deleteTemplate(id: string) {
       const result = await deleteTemplateAction(id);
       if (result.ok) setSavedTemplates(result.templates);
     }
   ```
4. Replace `handleGenerate` with:
   ```tsx
     async function handleGenerate() {
       setError(null);
       setLoading(true);
       try {
         const result = currentId ? await updateInvoiceAction(currentId, data) : await createInvoiceAction(data);
         if (!result.ok) { setError(result.error); return; }
         setEditCount(result.editCount);
         // The PDF route is free and ownership-checked; it serves the saved version.
         const a = document.createElement('a');
         a.href = `/invoices/${result.id}/pdf`;
         a.click();
         if (!currentId) {
           // Later clicks become edits, so a double-click cannot create a second invoice.
           setCurrentId(result.id);
           router.replace(`/invoices/${result.id}`);
         }
         router.refresh();
       } catch {
         setError('Something went wrong. Please try again.');
       } finally {
         setLoading(false);
       }
     }

     const pricingNote = currentId
       ? `Saved edits: ${editCount}. Edit #${nextPaidEdit(editCount)} uses 1 token. Unchanged downloads are free.`
       : 'Generating this invoice uses 1 token. The next 5 edits are free.';
   ```
5. In the top bar: change the back link `href="/"` to `href="/invoices"` and its label `Back` to `Invoices`; change the button label to `{loading ? 'SAVING…' : currentId ? 'SAVE & DOWNLOAD' : 'GENERATE PDF'}`.
6. Directly under the top bar's closing `</div>` (before `<div className="max-w-3xl mx-auto px-4 py-6 space-y-5">`), add:
   ```tsx
         <div className="max-w-3xl mx-auto px-4 pt-4">
           <p className="font-mono text-[11px] text-[#5C6A5E]">{pricingNote}</p>
           {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
         </div>
   ```
   and delete the old error rendering block further down (search for `{error &&` — keep only the new one).

- [ ] **Step 5: App shell, pages and PDF route**

`src/app/(app)/layout.tsx`:

```tsx
import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { isAdminEmail } from '@/lib/auth/admin-emails';
import { requireVerifiedUser } from '@/lib/auth/current-user';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVerifiedUser();
  return (
    <div className="min-h-screen bg-[#E7EBE2]">
      <header className="border-b border-[#C9D1C2] bg-[#E7EBE2]">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-4 text-sm">
          <Link href="/invoices" className="font-mono font-bold tracking-tight text-[#19261F]">
            INVOICE<span className="text-[#0B5C42]">·</span>PDF
          </Link>
          <nav className="flex gap-3 text-[#5C6A5E]">
            <Link href="/invoices" className="hover:text-[#19261F]">Invoices</Link>
            <Link href="/settings" className="hover:text-[#19261F]">Settings</Link>
            {isAdminEmail(user.email) && <Link href="/admin" className="hover:text-[#19261F]">Admin</Link>}
          </nav>
          <span className="ml-auto font-mono text-xs text-[#19261F]" data-testid="token-balance">
            {user.tokenBalance} tokens
          </span>
          <span className="hidden sm:inline text-xs text-[#5C6A5E]">{user.email}</span>
          <form action={logoutAction}>
            <button className="text-xs text-[#5C6A5E] hover:text-[#19261F]">Sign out</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
```

`src/app/(app)/invoices/page.tsx`:

```tsx
import Link from 'next/link';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { listInvoices } from '@/lib/invoices/service';

export const metadata = { title: 'Invoices — Invoice PDF' };

export default async function InvoicesPage() {
  const user = await requireVerifiedUser();
  const rows = await listInvoices(user.id);
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#19261F]">Invoices</h1>
        <Link
          href="/invoices/new"
          className="px-4 py-2 rounded-md bg-[#0B5C42] text-[#F6F7F1] font-mono text-[13px] font-bold hover:bg-[#094B36]"
        >
          NEW INVOICE
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[#5C6A5E]">No invoices yet. Creating one uses 1 token.</p>
      ) : (
        <div className="bg-white rounded-lg border border-[#C9D1C2] divide-y divide-[#D7DDCF]">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-3 flex items-center gap-4 text-sm">
              <Link href={`/invoices/${r.id}`} className="font-mono font-semibold text-[#19261F] hover:underline">
                {r.invoiceNumber}
              </Link>
              <span className="text-[#5C6A5E] truncate">{r.clientCompany}</span>
              <span className="ml-auto text-xs text-[#8A9587]">
                {r.editCount} edits · {r.updatedAt.toLocaleDateString('id-ID')}
              </span>
              <a href={`/invoices/${r.id}/pdf`} className="text-xs font-semibold text-[#0B5C42] hover:underline">
                PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

`src/app/(app)/invoices/new/page.tsx`:

```tsx
import { InvoiceForm } from '@/components/InvoiceForm';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { getSettings, settingsToInvoiceDefaults } from '@/lib/settings';
import { listTemplates } from '@/lib/templates';

export const metadata = { title: 'New invoice — Invoice PDF' };

export default async function NewInvoicePage() {
  const user = await requireVerifiedUser();
  const [settings, templates] = await Promise.all([getSettings(user.id), listTemplates(user.id)]);
  const initialData = { ...emptyInvoiceData(), ...settingsToInvoiceDefaults(settings) };
  return <InvoiceForm mode="new" initialData={initialData} templates={templates} />;
}
```

`src/app/(app)/invoices/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { InvoiceForm } from '@/components/InvoiceForm';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { getInvoice } from '@/lib/invoices/service';
import { listTemplates } from '@/lib/templates';

export const metadata = { title: 'Edit invoice — Invoice PDF' };

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireVerifiedUser();
  const { id } = await params;
  const invoice = await getInvoice(user.id, id);
  if (!invoice) notFound();
  return (
    <InvoiceForm
      mode="edit"
      invoiceId={invoice.id}
      editCount={invoice.editCount}
      initialData={invoice.data}
      templates={await listTemplates(user.id)}
    />
  );
}
```

`src/app/(app)/invoices/[id]/pdf/route.ts`:

```ts
import { getCurrentUser } from '@/lib/auth/current-user';
import { getInvoice } from '@/lib/invoices/service';
import { readLogo } from '@/lib/logo';
import { renderInvoicePdf } from '@/lib/pdf';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return new Response('Unauthorized', { status: 401 });
  const invoice = await getInvoice(user.id, (await params).id);
  if (!invoice) return new Response('Not found', { status: 404 });

  const pdf = await renderInvoicePdf(invoice.data, await readLogo(invoice.logoPath));
  const filename = `Invoice_${invoice.invoiceNumber.replace(/[^A-Za-z0-9._-]/g, '-')}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
```

`src/app/generator/page.tsx` (replace whole file):

```tsx
import { redirect } from 'next/navigation';

export default function GeneratorPage() {
  redirect('/invoices/new');
}
```

In `src/app/page.tsx`, change the three `href="/generator"` to `href="/invoices/new"`.

Delete the old API route and the leftover music file:

```bash
git rm src/app/api/generate-pdf/route.ts "public/music/Beautiful In White.mp3"
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no errors; all tests pass. Then `grep -rn "localStorage\|generate-pdf" src` → no matches.

- [ ] **Step 7: Commit**

```bash
git add -A src tests "public"
git commit -m "feat: store invoices and templates per user with token pricing"
```

---

### Task 10: Admin top-up

**Files:**
- Create: `src/lib/admin.ts`, `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/actions.ts`, `tests/admin.test.ts`

**Interfaces:**
- Consumes: `grantTokens` (Task 5), `requireAdmin` (Task 7).
- Produces: `listUsersForAdmin(): Promise<Array<{ id; email; tokenBalance; emailVerifiedAt; createdAt }>>`, `topUpTokens(actorUserId: string, targetUserId: string, amount: number): Promise<void>` (throws `RangeError` for amount outside 1–1000 or non-integer), action `topUpAction(formData: FormData): Promise<void>`.

- [ ] **Step 1: Write the failing test**

`tests/admin.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { tokenLedger, users } from '@/db/schema';
import { listUsersForAdmin, topUpTokens } from '@/lib/admin';
import { ledgerSum, makeUser, resetDb } from './helpers/db';

describe('admin top-up', () => {
  beforeEach(resetDb);

  it('adds tokens with an audited ledger row', async () => {
    const admin = await makeUser('admin@example.com');
    const user = await makeUser('u@example.com', { balance: 0 });
    await topUpTokens(admin.id, user.id, 25);
    const [u] = await getDb().select().from(users).where(eq(users.id, user.id));
    expect(u.tokenBalance).toBe(25);
    const [row] = await getDb().select().from(tokenLedger).where(eq(tokenLedger.userId, user.id));
    expect(row).toMatchObject({ delta: 25, reason: 'admin_topup', actorUserId: admin.id });
    expect(await ledgerSum(user.id)).toBe(25);
  });

  it('rejects amounts outside 1-1000 or fractional', async () => {
    const admin = await makeUser('admin@example.com');
    const user = await makeUser('u@example.com');
    for (const bad of [0, -5, 1001, 1.5]) {
      await expect(topUpTokens(admin.id, user.id, bad)).rejects.toBeInstanceOf(RangeError);
    }
  });

  it('lists users with balances', async () => {
    await makeUser('a@example.com', { balance: 3 });
    const list = await listUsersForAdmin();
    expect(list.map((u) => [u.email, u.tokenBalance])).toEqual([['a@example.com', 3]]);
  });
});
```

Run: `npx vitest run tests/admin.test.ts` → FAIL (module missing).

- [ ] **Step 2: Implement**

`src/lib/admin.ts`:

```ts
import { desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { grantTokens } from '@/lib/tokens';

export async function listUsersForAdmin() {
  return getDb()
    .select({
      id: users.id,
      email: users.email,
      tokenBalance: users.tokenBalance,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function topUpTokens(actorUserId: string, targetUserId: string, amount: number): Promise<void> {
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    throw new RangeError('Amount must be a whole number between 1 and 1000.');
  }
  await getDb().transaction((tx) => grantTokens(tx, targetUserId, amount, 'admin_topup', actorUserId));
}
```

`src/app/(app)/admin/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { topUpTokens } from '@/lib/admin';
import { requireAdmin } from '@/lib/auth/current-user';

// The amount input is constrained to 1-1000 in the browser; the updated balance
// in the list is the confirmation, and topUpTokens still enforces the range.
export async function topUpAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const amount = Number(formData.get('amount'));
  await topUpTokens(admin.id, userId, amount);
  revalidatePath('/admin');
}
```

`src/app/(app)/admin/page.tsx`:

```tsx
import { listUsersForAdmin } from '@/lib/admin';
import { requireAdmin } from '@/lib/auth/current-user';
import { topUpAction } from './actions';

export const metadata = { title: 'Admin — Invoice PDF' };

export default async function AdminPage() {
  await requireAdmin();
  const users = await listUsersForAdmin();
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-lg font-semibold text-[#19261F]">Users</h1>
      <div className="bg-white rounded-lg border border-[#C9D1C2] divide-y divide-[#D7DDCF]">
        {users.map((u) => (
          <div key={u.id} className="px-4 py-3 flex items-center gap-4 text-sm flex-wrap">
            <span className="font-medium text-[#19261F]">{u.email}</span>
            <span className="text-xs text-[#8A9587]">{u.emailVerifiedAt ? 'verified' : 'unverified'}</span>
            <span className="ml-auto font-mono text-xs">{u.tokenBalance} tokens</span>
            <form action={topUpAction} className="flex items-center gap-2">
              <input type="hidden" name="userId" value={u.id} />
              <input name="amount" type="number" min={1} max={1000} defaultValue={10} className="w-20 border border-[#BCC6B6] rounded px-2 py-1 text-sm" />
              <button className="px-3 py-1 rounded bg-[#0B5C42] text-white text-xs font-bold">TOP UP</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run tests and type-check**

Run: `npx vitest run tests/admin.test.ts && npx tsc --noEmit && npm run lint`
Expected: 3 passed, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin.ts "src/app/(app)/admin" tests/admin.test.ts
git commit -m "feat: add admin token top-up"
```

---

### Task 11: Production build, migrations on start, Docker and CI

**Files:**
- Modify: `next.config.ts`
- Create: `src/instrumentation.ts`, `src/app/healthz/route.ts`, `scripts/create-user.mjs`, `tests/create-user.test.ts`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.github/workflows/ci-cd.yml`

**Interfaces:**
- Consumes: `runMigrations` (Task 1), `hashPassword` (Task 2), `authenticate` (Task 5).
- Produces: `GET /healthz` → 200 `ok` / 503; `node scripts/create-user.mjs <email>` (password on stdin); image `ghcr.io/dhanuuwrdhn/invoice-generator-pdf:{latest,<sha>}`; compose service `app` reachable on network `web` as `invoice-app:3000`.

- [ ] **Step 1: Write the failing test for the bootstrap script**

`tests/create-user.test.ts`:

```ts
import { spawnSync } from 'node:child_process';
import { beforeEach, describe, expect, it } from 'vitest';
import { authenticate } from '@/lib/auth/service';
import { resetDb } from './helpers/db';

function run(email: string, password: string) {
  return spawnSync(process.execPath, ['scripts/create-user.mjs', email], {
    input: `${password}\n`,
    env: process.env,
    encoding: 'utf8',
  });
}

describe('create-user script', () => {
  beforeEach(resetDb);

  it('creates a verified user with a hashed password from stdin', async () => {
    const r = run('Admin@Example.com', 'secret-pass-1');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('created admin@example.com');
    const user = await authenticate('admin@example.com', 'secret-pass-1');
    expect(user?.emailVerifiedAt).not.toBeNull();
    expect(user?.passwordHash.startsWith('scrypt$')).toBe(true);
  });

  it('updates the password when the user exists', async () => {
    run('admin@example.com', 'secret-pass-1');
    const r = run('admin@example.com', 'secret-pass-2');
    expect(r.stdout).toContain('updated password for admin@example.com');
    expect(await authenticate('admin@example.com', 'secret-pass-2')).not.toBeNull();
  });

  it('refuses short passwords', () => {
    expect(run('admin@example.com', 'short').status).toBe(1);
  });
});
```

Run: `npx vitest run tests/create-user.test.ts` → FAIL (script missing).

- [ ] **Step 2: Implement the script**

`scripts/create-user.mjs`:

```js
// Usage (on the VPS):  docker compose exec app node scripts/create-user.mjs <email>
// Type the password, press Enter, then Ctrl+D. It is hashed immediately and never stored in plain text.
import postgres from 'postgres';
import { hashPassword } from '../src/lib/auth/password.mjs';

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('usage: node scripts/create-user.mjs <email>   (password on stdin)');
  process.exit(1);
}

let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/\r?\n$/, '');
if (password.length < 8) {
  console.error('password must be at least 8 characters');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
try {
  const passwordHash = await hashPassword(password);
  const [row] = await sql`
    INSERT INTO users (email, password_hash, email_verified_at)
    VALUES (${email}, ${passwordHash}, now())
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          email_verified_at = COALESCE(users.email_verified_at, now())
    RETURNING (xmax = 0) AS inserted`;
  console.log(row.inserted ? `created ${email}` : `updated password for ${email}`);
} finally {
  await sql.end();
}
```

Run: `npx vitest run tests/create-user.test.ts` → 3 passed.

- [ ] **Step 3: Build config, migrations on start, health check**

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
```

`src/instrumentation.ts`:

```ts
// Runs once when the Node server starts: apply pending migrations before serving traffic.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./db/migrate');
    await runMigrations();
  }
}
```

`src/app/healthz/route.ts`:

```ts
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await getDb().execute(sql`SELECT 1`);
    return new Response('ok');
  } catch {
    return new Response('db unavailable', { status: 503 });
  }
}
```

Run: `npm run build`
Expected: build succeeds; `.next/standalone/server.js` exists.

Local smoke against the test DB (tunnel still up), SMTP unset so mail prints to the console:

```bash
DATABASE_URL=postgres://postgres:test@127.0.0.1:55432/invoice_test APP_URL=http://localhost:3000 ADMIN_EMAILS=admin@example.com npm run start
```

In another shell: `curl -s localhost:3000/healthz` → `ok`; `curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3000/invoices` → `307 http://localhost:3000/login`. Stop the server.

- [ ] **Step 4: Docker files**

`.dockerignore`:

```
node_modules
.next
.git
.env*
uploads
.test-uploads
docs
tests
```

`Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/app/uploads
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src/lib/auth/password.mjs ./src/lib/auth/password.mjs
# Named volumes inherit this ownership on first mount.
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

`docker-compose.yml`:

```yaml
services:
  app:
    # CI pushes this image; TAG is set to the commit SHA on deploy.
    image: ghcr.io/dhanuuwrdhn/invoice-generator-pdf:${TAG:-latest}
    env_file: .env
    volumes:
      - uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      default: {}
      web:
        aliases: [invoice-app]
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: invoice
      POSTGRES_USER: invoice
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U invoice -d invoice"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

volumes:
  uploads:
  pg_data:

networks:
  web:
    external: true
```

- [ ] **Step 5: CI/CD workflow**

`.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
  workflow_dispatch:

env:
  IMAGE: ghcr.io/dhanuuwrdhn/invoice-generator-pdf
  SITE_URL: https://invoice.bornworks.biz.id

jobs:
  test:
    name: Lint, typecheck, test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: invoice_test
        ports: ['55432:5432']
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      TEST_DATABASE_URL: postgres://postgres:test@127.0.0.1:55432/invoice_test
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test

  build:
    name: Build image
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v5
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        if: github.event_name != 'pull_request'
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            ${{ env.IMAGE }}:latest
            ${{ env.IMAGE }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to VPS
    needs: build
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read
    environment:
      name: production
      url: ${{ env.SITE_URL }}
    concurrency:
      group: production
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v5

      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/id_ed25519
          echo "${{ secrets.VPS_KNOWN_HOSTS }}" > ~/.ssh/known_hosts
          chmod 600 ~/.ssh/id_ed25519

      - name: Sync compose file
        run: scp docker-compose.yml ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:~/invoice/

      - name: Pull and restart
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
            "TAG=${{ github.sha }} GHCR_USER=${{ github.actor }} bash -s" <<'EOF'
          set -euo pipefail
          cd ~/invoice
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
          docker compose pull app
          docker logout ghcr.io
          # Keep :latest pointing at the deployed image so manual `docker compose up` works.
          docker tag "ghcr.io/dhanuuwrdhn/invoice-generator-pdf:$TAG" ghcr.io/dhanuuwrdhn/invoice-generator-pdf:latest
          docker compose up -d --no-build --remove-orphans
          docker image prune -f
          EOF

      - name: Health check
        run: |
          for i in $(seq 1 20); do
            code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL/healthz" || true)
            echo "attempt $i: $code"
            [ "$code" = "200" ] && exit 0
            sleep 5
          done
          exit 1
```

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: everything green.

```bash
git add next.config.ts src/instrumentation.ts src/app/healthz scripts tests/create-user.test.ts Dockerfile .dockerignore docker-compose.yml .github
git commit -m "chore: add docker image, compose stack, and CI/CD pipeline"
```

(Do **not** push yet — the VPS needs `~/invoice/.env`, the `web` network and the secrets first; see Task 13.)

---

### Task 12: End-to-end check against a local production build

**Files:**
- Create (scratchpad, not committed): `<scratchpad>/wk/e2e-invoice.mjs`

**Interfaces:**
- Consumes: everything above; Playwright from the scratchpad (`<scratchpad>/wk` already has `playwright`; run `npx playwright install chromium` there once).

- [ ] **Step 1: Write the E2E script**

The script starts `next start` itself (so it can read the `[mail:dev]` lines that carry the verification link), then drives Chromium. Replace `<repo>` with `D:/dev/bornworks/invoice-generator-pdf`.

```js
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const REPO = 'D:/dev/bornworks/invoice-generator-pdf';
const BASE = 'http://localhost:3100';
const env = {
  ...process.env,
  PORT: '3100',
  DATABASE_URL: 'postgres://postgres:test@127.0.0.1:55432/invoice_test',
  APP_URL: BASE,
  ADMIN_EMAILS: 'admin@example.com',
  UPLOAD_DIR: `${REPO}/.test-uploads`,
};
delete env.SMTP_HOST;

const server = spawn('npm', ['run', 'start'], { cwd: REPO, env, shell: true });
let log = '';
server.stdout.on('data', (d) => (log += d));
server.stderr.on('data', (d) => (log += d));
const waitFor = async (re, ms = 30000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const m = log.match(re);
    if (m) return m;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`timeout waiting for ${re}\n${log.slice(-2000)}`);
};
const assert = (cond, msg) => { if (!cond) throw new Error(`ASSERT: ${msg}`); };

try {
  await waitFor(/Ready in|started server/i);
  const browser = await chromium.launch();
  const stamp = Date.now();

  async function signUp(email) {
    const ctx = await browser.newContext({ acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/register`);
    await page.fill('#email', email);
    await page.fill('#password', 'password-123');
    await page.click('button:has-text("CREATE ACCOUNT")');
    await page.waitForURL(/\/verify\?sent=1/);
    const [, token] = await waitFor(new RegExp(`to=${email}[\\s\\S]*?/verify\\?token=([\\w-]+)`));
    await page.goto(`${BASE}/verify?token=${token}`);
    await page.click('button:has-text("VERIFY EMAIL")');
    await page.waitForURL(/\/invoices$/);
    return page;
  }
  const balance = async (page) => Number((await page.textContent('[data-testid=token-balance]')).match(/\d+/)[0]);

  const page = await signUp(`e2e-${stamp}@example.com`);
  assert((await balance(page)) === 10, 'starts with 10 tokens');

  // New invoice; double-click must still cost exactly one token.
  await page.goto(`${BASE}/invoices/new`);
  await page.fill('input[placeholder="INV-DP/001/IV/2026"]', `E2E-${stamp}`);
  await page.fill('input[placeholder="PT. Company Name"]', 'PT. E2E');
  const firstDownload = page.waitForEvent('download');
  await page.dblclick('button:has-text("GENERATE PDF")');
  await firstDownload;
  await page.waitForURL(/\/invoices\/[0-9a-f-]{36}$/);
  const invoiceUrl = page.url();
  await page.reload();
  assert((await balance(page)) === 9, 'one token for a new invoice (double-click safe)');

  // Six edits: only the sixth costs a token.
  for (let i = 1; i <= 6; i++) {
    await page.fill('input[placeholder="PT. Company Name"]', `PT. E2E v${i}`);
    const dl = page.waitForEvent('download');
    await page.click('button:has-text("SAVE & DOWNLOAD")');
    await dl;
  }
  await page.reload();
  assert((await balance(page)) === 8, 'sixth edit costs one token');

  // Re-download from the list is free.
  await page.goto(`${BASE}/invoices`);
  const dl = page.waitForEvent('download');
  await page.click('a:has-text("PDF")');
  await dl;
  await page.reload();
  assert((await balance(page)) === 8, 're-download is free');

  // Another user cannot open the invoice or its PDF.
  const other = await signUp(`e2e-other-${stamp}@example.com`);
  const res = await other.goto(invoiceUrl);
  assert(res.status() === 404, 'foreign invoice page is 404');
  const pdfRes = await other.request.get(`${invoiceUrl}/pdf`);
  assert(pdfRes.status() === 404, 'foreign invoice PDF is 404');

  // Logged-out access goes to /login.
  await other.click('button:has-text("Sign out")');
  await other.goto(invoiceUrl);
  assert(other.url().endsWith('/login'), 'signed-out users are sent to /login');

  console.log('E2E OK');
  await browser.close();
} finally {
  server.kill();
}
```

- [ ] **Step 2: Build and run**

```bash
cd D:/dev/bornworks/invoice-generator-pdf && npm run build
cd <scratchpad>/wk && npx playwright install chromium && node e2e-invoice.mjs
```

Expected: last line `E2E OK`. Any `ASSERT:` line names the broken behavior — fix it in the owning task's code, re-run that task's tests, then re-run E2E.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A src tests
git commit -m "fix: <what the E2E run exposed>"
```

(Skip if nothing changed.)

---

### Task 13: VPS deployment

**Files:**
- Landing repo `D:/dev/bornworks/landing-page-bornworks`: modify `docker-compose.yml`, `Caddyfile`, `.github/workflows/ci-cd.yml`
- VPS: `~/invoice/.env`, crontab
- Skill: `D:/dev/agents/skills/bornworks-landing-ops/SKILL.md` (+ copy to `D:/dev/claude/skills/`)

- [ ] **Step 1: Shared network and invoice env on the VPS**

```bash
ssh bornworks 'docker network create web 2>/dev/null || true; docker network ls --filter name=^web$ --format "{{.Name}}"'
```

Expected: `web`.

Create `~/invoice/.env` without printing secrets (DB password generated on the VPS; SMTP copied from the landing `.env`):

```bash
ssh bornworks 'set -e; mkdir -p ~/invoice/backups; cd ~/invoice
PW=$(openssl rand -hex 24)
{
  echo "POSTGRES_PASSWORD=$PW"
  echo "DATABASE_URL=postgres://invoice:$PW@postgres:5432/invoice"
  grep -E "^SMTP_(HOST|PORT|USER|PASS)=" ~/bornworks/.env
  echo "MAIL_FROM=Bornworks Invoice <noreply@bornworks.biz.id>"
  echo "APP_URL=https://invoice.bornworks.biz.id"
  echo "ADMIN_EMAILS=dhanuakun1@gmail.com,bornworks2026@gmail.com"
} > .env
chmod 600 .env
sed -E "s/(PASS|PASSWORD|DATABASE_URL)=.*/\1=***/" .env'
```

Expected: 9 lines, secrets masked.

- [ ] **Step 2: Landing Caddy joins `web` and proxies the invoice domain**

In the landing repo `docker-compose.yml`, give `caddy` both networks and declare `web` as external:

```yaml
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
    depends_on: [app]
    networks: [default, web]
    restart: unless-stopped

volumes:
  caddy_data:

networks:
  web:
    external: true
```

Append to the landing `Caddyfile`:

```
invoice.bornworks.biz.id {
	reverse_proxy invoice-app:3000
}
```

In the landing `.github/workflows/ci-cd.yml`, after `docker compose up -d --no-build --remove-orphans`, add (a Caddyfile-only change does not recreate the container):

```bash
          docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
```

Commit and push the landing repo, then wait for its run:

```bash
cd D:/dev/bornworks/landing-page-bornworks
git add docker-compose.yml Caddyfile .github/workflows/ci-cd.yml
git -c user.name=Dhanuuwrdhn -c user.email=dhanuwardhan10@gmail.com commit -m "chore: route invoice.bornworks.biz.id through shared caddy"
git push origin main
```

Expected: landing CI green; `https://bornworks.biz.id` still 200; `https://invoice.bornworks.biz.id` returns 502 (cert issued, app not up yet).

- [ ] **Step 3: Deploy key and secrets for the invoice repo**

```bash
K="$TEMP/inv_deploy_key"; rm -f "$K" "$K.pub"
ssh-keygen -q -t ed25519 -N "" -C "github-actions-invoice-deploy" -f "$K"
cat "$K.pub" | ssh bornworks 'cat >> ~/.ssh/authorized_keys'
ssh-keyscan -t ed25519,ecdsa,rsa 43.134.133.227 2>/dev/null > "$TEMP/inv_known_hosts"
R=Dhanuuwrdhn/invoice-generator-pdf
gh secret set VPS_SSH_KEY -R $R < "$K"
gh secret set VPS_KNOWN_HOSTS -R $R < "$TEMP/inv_known_hosts"
gh secret set VPS_HOST -R $R -b 43.134.133.227
gh secret set VPS_USER -R $R -b ubuntu
rm -f "$K" "$K.pub" "$TEMP/inv_known_hosts"
gh secret list -R $R
```

Expected: four `VPS_*` secrets listed; no key left on the laptop.

- [ ] **Step 4: Push the invoice repo and watch the pipeline**

```bash
cd D:/dev/bornworks/invoice-generator-pdf && git push origin master
gh run watch $(gh run list -R Dhanuuwrdhn/invoice-generator-pdf -L 1 --json databaseId --jq '.[0].databaseId') -R Dhanuuwrdhn/invoice-generator-pdf --exit-status
```

Expected: test, build and deploy jobs green; health check passes on `https://invoice.bornworks.biz.id/healthz`.

- [ ] **Step 5: Admin accounts (the user types the passwords)**

Ask the user to run each command themselves with the `!` prefix, type the password, press Enter, then Ctrl+D:

```
! ssh -t bornworks "cd ~/invoice && docker compose exec app node scripts/create-user.mjs dhanuakun1@gmail.com"
! ssh -t bornworks "cd ~/invoice && docker compose exec app node scripts/create-user.mjs bornworks2026@gmail.com"
```

Expected output: `created <email>` for each. Remind them to change the password from `/settings` because it was shared in chat.

- [ ] **Step 6: Daily backup**

```bash
ssh bornworks '(crontab -l 2>/dev/null | grep -v invoice-backup; echo "15 3 * * * cd ~/invoice && docker compose exec -T postgres pg_dump -U invoice invoice | gzip > backups/invoice-\$(date +\%F).sql.gz && ls -1t backups/*.sql.gz | tail -n +8 | xargs -r rm # invoice-backup") | crontab - && crontab -l | grep invoice-backup'
ssh bornworks 'cd ~/invoice && docker compose exec -T postgres pg_dump -U invoice invoice | gzip > backups/manual-test.sql.gz && ls -la backups && rm backups/manual-test.sql.gz'
```

Expected: cron line present; manual dump file is non-empty.

- [ ] **Step 7: Production smoke test and cleanup**

```bash
for p in healthz login register; do curl -s --ssl-no-revoke -o /dev/null -w "$p %{http_code}\n" https://invoice.bornworks.biz.id/$p; done
curl -s --ssl-no-revoke -o /dev/null -w "invoices %{http_code} -> %{redirect_url}\n" https://invoice.bornworks.biz.id/invoices
curl -s --ssl-no-revoke -o /dev/null -w "landing %{http_code}\n" https://bornworks.biz.id
ssh bornworks 'docker ps --format "{{.Names}} {{.Ports}}" | grep -i postgres'
```

Expected: `healthz 200`, `login 200`, `register 200`, `invoices 307 -> .../login`, `landing 200`; the invoice Postgres line shows **no** `0.0.0.0` port.

Then remove the temporary test DB and stop the tunnel:

```bash
ssh bornworks 'docker rm -f invoice-testdb'
```

(Stop the background `ssh -N -L 55432...` task.)

- [ ] **Step 8: Record ops knowledge**

Add an "Invoice app" section to `D:/dev/agents/skills/bornworks-landing-ops/SKILL.md` covering: repo/branch, `~/invoice` layout, shared `web` network + Caddy block, CI secrets, `create-user.mjs` usage, backup cron and restore command (`gunzip -c backups/<file> | docker compose exec -T postgres psql -U invoice invoice`), and that `ADMIN_EMAILS` grants `/admin`. Copy the file to `D:/dev/claude/skills/bornworks-landing-ops/SKILL.md`.
