import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { emailTokens, rateLimits, sessions } from '@/db/schema';
import { pruneExpiredRows } from '@/lib/prune';
import { makeUser, resetDb } from './helpers/db';

const ago = (ms: number) => new Date(Date.now() - ms);
const ahead = (ms: number) => new Date(Date.now() + ms);
const HOUR = 60 * 60 * 1000;

describe('pruneExpiredRows', () => {
  beforeEach(resetDb);

  it('deletes expired rows and keeps live ones', async () => {
    const user = await makeUser();
    await getDb().insert(sessions).values([
      { id: 'expired', userId: user.id, expiresAt: ago(1000) },
      { id: 'live', userId: user.id, expiresAt: ahead(HOUR) },
    ]);
    await getDb().insert(emailTokens).values([
      { tokenHash: 'expired', userId: user.id, purpose: 'verify', expiresAt: ago(1000) },
      { tokenHash: 'used', userId: user.id, purpose: 'reset', expiresAt: ahead(HOUR), usedAt: ago(1000) },
      { tokenHash: 'live', userId: user.id, purpose: 'verify', expiresAt: ahead(HOUR) },
    ]);
    await getDb().insert(rateLimits).values([
      // Older than the longest window in RATE_LIMITS (1 hour), so it has ended for every key.
      { key: 'ended', count: 3, windowStart: ago(2 * HOUR) },
      { key: 'live', count: 3, windowStart: ago(1000) },
    ]);

    expect(await pruneExpiredRows()).toEqual({ sessions: 1, emailTokens: 2, rateLimits: 1 });

    const ids = async (table: string, col: string) =>
      (await getDb().execute<{ id: string }>(sql.raw(`SELECT ${col} AS id FROM ${table} ORDER BY 1`))).map((r) => r.id);
    expect(await ids('sessions', 'id')).toEqual(['live']);
    expect(await ids('email_tokens', 'token_hash')).toEqual(['live']);
    expect(await ids('rate_limits', 'key')).toEqual(['live']);
  });

  it('is a no-op on an empty database', async () => {
    expect(await pruneExpiredRows()).toEqual({ sessions: 0, emailTokens: 0, rateLimits: 0 });
  });
});
