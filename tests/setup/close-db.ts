import { afterAll } from 'vitest';
import { getDb } from '@/db';

// Each test file runs in its own worker with its own pool; close it so Vitest can exit.
afterAll(async () => {
  await getDb().$client.end();
});
