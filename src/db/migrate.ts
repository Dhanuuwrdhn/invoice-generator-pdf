import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from './index';

export async function runMigrations() {
  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
}
