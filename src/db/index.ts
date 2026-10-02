import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // Notices are informational (e.g. "schema already exists" during migrate) and only add log noise.
  return drizzle(postgres(url, { max: 10, onnotice: () => {} }), { schema });
}

let db: ReturnType<typeof create> | undefined;

// Lazy so `next build` can import modules without a database.
export function getDb() {
  return (db ??= create());
}

export type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
