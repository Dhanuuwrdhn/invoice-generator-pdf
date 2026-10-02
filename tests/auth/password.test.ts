import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password.mjs';

describe('password', () => {
  it('hashes into the scrypt$N$r$p$salt$key format', async () => {
    const stored = await hashPassword('correct horse');
    expect(stored).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  });

  it('verifies the right password and rejects the wrong one', async () => {
    const stored = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('correct horsf', stored)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('returns false for malformed stored values', async () => {
    expect(await verifyPassword('x', 'unused')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$1$2$3$!!$!!')).toBe(false);
  });
});
