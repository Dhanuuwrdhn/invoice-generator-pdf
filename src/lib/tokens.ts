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
