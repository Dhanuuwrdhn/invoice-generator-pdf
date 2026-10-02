import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { userSettings } from '@/db/schema';
import type { UserSettingsInput } from '@/lib/validation';
import type { FontChoice, InvoiceData } from '@/types/invoice';

export type UserSettings = UserSettingsInput & { logoPath: string | null };

const DEFAULTS: UserSettings = {
  fontFamily: 'Caladea',
  primaryColor: '#1A3A5C',
  logoPath: null,
  senderName: '', senderTitle: '', senderLocation: '', senderPhone: '', senderEmail: '',
  bankName: '', accountNumber: '', accountHolder: '',
};

export async function getSettings(userId: string): Promise<UserSettings> {
  const [row] = await getDb().select().from(userSettings).where(eq(userSettings.userId, userId));
  if (!row) return { ...DEFAULTS };
  return {
    fontFamily: row.fontFamily as FontChoice,
    primaryColor: row.primaryColor,
    logoPath: row.logoPath,
    senderName: row.senderName,
    senderTitle: row.senderTitle,
    senderLocation: row.senderLocation,
    senderPhone: row.senderPhone,
    senderEmail: row.senderEmail,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    accountHolder: row.accountHolder,
  };
}

export async function saveSettings(userId: string, input: UserSettingsInput): Promise<void> {
  await getDb()
    .insert(userSettings)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: userSettings.userId, set: { ...input, updatedAt: new Date() } });
}

export async function setLogoPath(userId: string, logoPath: string | null): Promise<void> {
  await getDb()
    .insert(userSettings)
    .values({ userId, logoPath })
    .onConflictDoUpdate({ target: userSettings.userId, set: { logoPath, updatedAt: new Date() } });
}

export function settingsToInvoiceDefaults(s: UserSettings): Partial<InvoiceData> {
  return {
    fontFamily: s.fontFamily,
    primaryColor: s.primaryColor,
    senderName: s.senderName,
    senderTitle: s.senderTitle,
    senderLocation: s.senderLocation,
    senderPhone: s.senderPhone,
    senderEmail: s.senderEmail,
    bankName: s.bankName,
    accountNumber: s.accountNumber,
    accountHolder: s.accountHolder,
  };
}
