import { randomBytes } from 'node:crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
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

// Cheap pre-check (no write) so callers can skip expensive work for junk tokens.
export async function isEmailTokenUsable(raw: string, purpose: EmailTokenPurpose): Promise<boolean> {
  const rows = await getDb()
    .select({ userId: emailTokens.userId })
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.tokenHash, hashToken(raw)),
        eq(emailTokens.purpose, purpose),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, sql`now()`),
      ),
    )
    .limit(1);
  return rows.length > 0;
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
        // Compare on the database clock: expiry is checked where it is stored.
        gt(emailTokens.expiresAt, sql`now()`),
      ),
    )
    .returning({ userId: emailTokens.userId });
  return rows[0]?.userId ?? null;
}
