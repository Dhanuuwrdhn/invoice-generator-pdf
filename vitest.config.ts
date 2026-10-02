import path from 'node:path';
import { defineConfig } from 'vitest/config';

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:test@127.0.0.1:55432/invoice_test';
process.env.ADMIN_EMAILS = 'admin@example.com';
process.env.APP_URL = 'http://localhost:3000';

export default defineConfig({
  resolve: { alias: { '@': path.resolve('src') } },
  test: {
    environment: 'node',
    globalSetup: ['tests/setup/global-setup.ts'],
    setupFiles: ['tests/setup/close-db.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
