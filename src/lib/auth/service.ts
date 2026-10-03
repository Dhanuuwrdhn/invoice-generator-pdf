import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, type User } from '@/db/schema';
import { grantTokens, SIGNUP_BONUS } from '@/lib/tokens';
import { consumeEmailToken, isEmailTokenUsable, issueEmailToken } from './email-tokens';
import { hashPassword, verifyPassword } from './password.mjs';
import { createSession, deleteAllSessions } from './session';

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
  // Reject junk tokens before paying for scrypt; the consume below stays the authoritative check.
  if (!(await isEmailTokenUsable(rawToken, 'reset'))) return false;
  const passwordHash = await hashPassword(newPassword);
  return getDb().transaction(async (tx) => {
    const userId = await consumeEmailToken(rawToken, 'reset', tx);
    if (!userId) return false;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await deleteAllSessions(userId, tx);
    return true;
  });
}

// Signs out every session (a password change usually means suspected access) and
// returns a fresh one for the caller; false when the current password is wrong.
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ token: string; expiresAt: Date } | false> {
  const [user] = await getDb().select().from(users).where(eq(users.id, userId));
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) return false;
  const passwordHash = await hashPassword(newPassword);
  await getDb().transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await deleteAllSessions(userId, tx);
  });
  return createSession(userId);
}
