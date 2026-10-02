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
