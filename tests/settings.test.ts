import { beforeEach, describe, expect, it } from 'vitest';
import { getSettings, saveSettings, setLogoPath, settingsToInvoiceDefaults } from '@/lib/settings';
import { makeUser, resetDb } from './helpers/db';

const input = {
  fontFamily: 'Lato' as const,
  primaryColor: '#334155',
  senderName: 'Ada', senderTitle: 'Dev', senderLocation: 'Jakarta', senderPhone: '0812', senderEmail: 'ada@x.co',
  bankName: 'BCA', accountNumber: '123', accountHolder: 'Ada',
};

describe('settings', () => {
  beforeEach(resetDb);

  it('returns defaults before anything is saved', async () => {
    const user = await makeUser();
    const s = await getSettings(user.id);
    expect(s.fontFamily).toBe('Caladea');
    expect(s.logoPath).toBeNull();
  });

  it('saves per user without touching others', async () => {
    const a = await makeUser('a@example.com');
    const b = await makeUser('b@example.com');
    await saveSettings(a.id, input);
    await setLogoPath(a.id, `${a.id}/logo-x.png`);
    expect((await getSettings(a.id)).senderName).toBe('Ada');
    expect((await getSettings(a.id)).logoPath).toBe(`${a.id}/logo-x.png`);
    expect((await getSettings(b.id)).senderName).toBe('');
  });

  it('maps settings to invoice defaults', async () => {
    const user = await makeUser();
    await saveSettings(user.id, input);
    const d = settingsToInvoiceDefaults(await getSettings(user.id));
    expect(d).toMatchObject({ fontFamily: 'Lato', primaryColor: '#334155', senderName: 'Ada', bankName: 'BCA' });
    expect('logoPath' in d).toBe(false);
  });
});
