import { requireVerifiedUser } from '@/lib/auth/current-user';
import { getSettings } from '@/lib/settings';
import { SettingsForm } from './settings-form';

export const metadata = { title: 'Settings — Invoice PDF' };

export default async function SettingsPage() {
  const user = await requireVerifiedUser();
  const settings = await getSettings(user.id);
  // The file name changes on every upload, so it doubles as a cache-buster.
  const logoVersion = settings.logoPath?.split('/').pop() ?? null;
  return <SettingsForm settings={settings} logoVersion={logoVersion} />;
}
