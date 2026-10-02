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
