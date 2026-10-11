import { isNotNull, lte, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { emailTokens, rateLimits, sessions } from '@/db/schema';
import { RATE_LIMITS } from '@/lib/rate-limit';

const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

// rate_limits does not store each key's window length, so wait for the longest one.
// A row past its window is dead either way: hitRateLimit would restart its count.
const LONGEST_WINDOW_SECONDS = Math.max(...Object.values(RATE_LIMITS).map((r) => r.windowSeconds));

export async function pruneExpiredRows(): Promise<{ sessions: number; emailTokens: number; rateLimits: number }> {
  const db = getDb();
  const [s, e, r] = await Promise.all([
    db.delete(sessions).where(lte(sessions.expiresAt, sql`now()`)).returning({ id: sessions.id }),
    db
      .delete(emailTokens)
      .where(or(lte(emailTokens.expiresAt, sql`now()`), isNotNull(emailTokens.usedAt)))
      .returning({ id: emailTokens.tokenHash }),
    db
      .delete(rateLimits)
      .where(lte(rateLimits.windowStart, sql`now() - make_interval(secs => ${LONGEST_WINDOW_SECONDS}::double precision)`))
      .returning({ id: rateLimits.key }),
  ]);
  return { sessions: s.length, emailTokens: e.length, rateLimits: r.length };
}

function pruneInBackground() {
  pruneExpiredRows().catch((err) => console.error('[prune]', err));
}

// Called once per server process: prune now, then hourly. Never awaited, so
// startup and requests do not wait on it; unref() lets the process exit.
export function startPruning() {
  pruneInBackground();
  setInterval(pruneInBackground, PRUNE_INTERVAL_MS).unref();
}
