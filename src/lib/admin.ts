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
