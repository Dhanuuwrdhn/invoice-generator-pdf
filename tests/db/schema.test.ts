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
    ).rejects.toMatchObject({ cause: { constraint_name: 'users_token_balance_non_negative' } });
  });

  it('cascades user deletion to sessions', async () => {
    const user = await makeUser();
    await getDb().insert(sessions).values({ id: 'h', userId: user.id, expiresAt: new Date(Date.now() + 1000) });
    await getDb().delete(users).where(eq(users.id, user.id));
    expect(await getDb().select().from(sessions)).toHaveLength(0);
  });
});
