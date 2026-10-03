import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const RATE_LIMITS = {
  login: { limit: 5, windowSeconds: 15 * 60 },
  // Coarse per-IP cap so rotating emails cannot force unlimited scrypt work.
  loginIp: { limit: 30, windowSeconds: 15 * 60 },
  reset: { limit: 10, windowSeconds: 60 * 60 },
  register: { limit: 3, windowSeconds: 60 * 60 },
  resendVerification: { limit: 1, windowSeconds: 60 },
  forgot: { limit: 3, windowSeconds: 60 * 60 },
} as const;

// Fixed window counter in Postgres; returns true while the caller is within the limit.
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await getDb().execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, count, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision) THEN 1
        ELSE rate_limits.count + 1 END,
      window_start = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision) THEN now()
        ELSE rate_limits.window_start END
    RETURNING count`);
  return Number(rows[0].count) <= limit;
}

export async function allowLoginAttempt(ip: string, email: string): Promise<boolean> {
  const perIp = await hitRateLimit(`loginIp:${ip}`, RATE_LIMITS.loginIp.limit, RATE_LIMITS.loginIp.windowSeconds);
  const perEmail = await hitRateLimit(`login:${ip}:${email}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowSeconds);
  return perIp && perEmail;
}
