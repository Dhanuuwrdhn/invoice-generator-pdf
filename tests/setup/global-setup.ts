import { getDb } from '../../src/db';
import { runMigrations } from '../../src/db/migrate';

export default async function setup() {
  await runMigrations();
  return async () => {
    await getDb().$client.end();
  };
}
