import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await getDb().execute(sql`SELECT 1`);
    return new Response('ok');
  } catch {
    return new Response('db unavailable', { status: 503 });
  }
}
