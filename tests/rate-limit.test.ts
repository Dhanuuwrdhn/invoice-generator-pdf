import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { allowLoginAttempt, hitRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { resetDb } from './helpers/db';

describe('hitRateLimit', () => {
  beforeEach(resetDb);

  it('allows up to the limit then blocks', async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit('login:1.2.3.4', 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });

  it('keeps keys independent', async () => {
    await hitRateLimit('a', 1, 60);
    expect(await hitRateLimit('b', 1, 60)).toBe(true);
  });

  it('opens a new window after the old one expires', async () => {
    await hitRateLimit('k', 1, 60);
    expect(await hitRateLimit('k', 1, 60)).toBe(false);
    await getDb().execute(sql`UPDATE rate_limits SET window_start = now() - interval '2 minutes' WHERE key = 'k'`);
    expect(await hitRateLimit('k', 1, 60)).toBe(true);
  });
});

describe('getClientIp', () => {
  it('uses the last X-Forwarded-For entry (the one Caddy appended)', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '6.6.6.6, 9.9.9.9' }))).toBe('9.9.9.9');
  });

  it('falls back to unknown', () => {
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});

describe('allowLoginAttempt', () => {
  beforeEach(resetDb);

  it('caps attempts per IP even when every attempt uses a new email', async () => {
    const results = [];
    for (let i = 0; i < 31; i++) results.push(await allowLoginAttempt('7.7.7.7', `user${i}@example.com`));
    expect(results.slice(0, 30).every(Boolean)).toBe(true);
    expect(results[30]).toBe(false);
  });

  it('still caps repeated attempts on one email', async () => {
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await allowLoginAttempt('8.8.8.8', 'same@example.com'));
    expect(results).toEqual([true, true, true, true, true, false]);
  });
});
