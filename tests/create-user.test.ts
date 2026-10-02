import { spawnSync } from 'node:child_process';
import { beforeEach, describe, expect, it } from 'vitest';
import { authenticate } from '@/lib/auth/service';
import { resetDb } from './helpers/db';

function run(email: string, password: string) {
  return spawnSync(process.execPath, ['scripts/create-user.mjs', email], {
    input: `${password}\n`,
    env: process.env,
    encoding: 'utf8',
  });
}

describe('create-user script', () => {
  beforeEach(resetDb);

  it('creates a verified user with a hashed password from stdin', async () => {
    const r = run('Admin@Example.com', 'secret-pass-1');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('created admin@example.com');
    const user = await authenticate('admin@example.com', 'secret-pass-1');
    expect(user?.emailVerifiedAt).not.toBeNull();
    expect(user?.passwordHash.startsWith('scrypt$')).toBe(true);
  });

  it('updates the password when the user exists', async () => {
    run('admin@example.com', 'secret-pass-1');
    const r = run('admin@example.com', 'secret-pass-2');
    expect(r.stdout).toContain('updated password for admin@example.com');
    expect(await authenticate('admin@example.com', 'secret-pass-2')).not.toBeNull();
  });

  it('refuses short passwords', () => {
    expect(run('admin@example.com', 'short').status).toBe(1);
  });
});
