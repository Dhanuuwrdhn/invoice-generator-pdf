import { beforeEach, describe, expect, it, vi } from 'vitest';

const hashSpy = vi.hoisted(() => ({ calls: 0 }));
vi.mock('@/lib/auth/password.mjs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/password.mjs')>();
  return {
    ...actual,
    hashPassword: async (password: string) => {
      hashSpy.calls++;
      return actual.hashPassword(password);
    },
  };
});

const { resetPassword } = await import('@/lib/auth/service');
const { resetDb } = await import('../helpers/db');

describe('resetPassword cost', () => {
  beforeEach(async () => {
    await resetDb();
    hashSpy.calls = 0;
  });

  it('does not run scrypt for an invalid token', async () => {
    expect(await resetPassword('junk-token', 'new-password')).toBe(false);
    expect(hashSpy.calls).toBe(0);
  });
});
