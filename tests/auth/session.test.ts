import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { createSession, deleteAllSessions, deleteSession, getUserBySessionToken } from '@/lib/auth/session';
import { makeUser, resetDb } from '../helpers/db';

describe('sessions', () => {
  beforeEach(resetDb);

  it('resolves a fresh session to its user and stores only a hash', async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id);
    expect((await getUserBySessionToken(token))?.id).toBe(user.id);
    const rows = await getDb().execute<{ id: string }>(sql`SELECT id FROM sessions`);
    expect(rows[0].id).not.toBe(token);
    expect(rows[0].id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('expired session returns null', async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id);
    await getDb().execute(sql`UPDATE sessions SET expires_at = now() - interval '1 second'`);
    expect(await getUserBySessionToken(token)).toBeNull();
  });

  it('unknown token returns null', async () => {
    expect(await getUserBySessionToken('nope')).toBeNull();
  });

  it('deletes one or all sessions', async () => {
    const user = await makeUser();
    const a = await createSession(user.id);
    const b = await createSession(user.id);
    await deleteSession(a.token);
    expect(await getUserBySessionToken(a.token)).toBeNull();
    expect(await getUserBySessionToken(b.token)).not.toBeNull();
    await deleteAllSessions(user.id);
    expect(await getUserBySessionToken(b.token)).toBeNull();
  });
});
