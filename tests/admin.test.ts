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
