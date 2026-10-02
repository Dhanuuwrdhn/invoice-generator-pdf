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
