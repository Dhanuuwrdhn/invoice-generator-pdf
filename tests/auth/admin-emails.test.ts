import { describe, expect, it } from 'vitest';
import { isAdminEmail } from '@/lib/auth/admin-emails';

describe('isAdminEmail', () => {
  it('matches case-insensitively and ignores others', () => {
    expect(isAdminEmail('Admin@Example.com')).toBe(true);
    expect(isAdminEmail('user@example.com')).toBe(false);
  });
});
