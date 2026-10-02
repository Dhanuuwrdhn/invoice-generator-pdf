'use server';

import { revalidatePath } from 'next/cache';
import type { FormState } from '@/app/(auth)/actions';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { changePassword } from '@/lib/auth/service';
import { InvalidLogoError, saveLogo } from '@/lib/logo';
import { saveSettings, setLogoPath } from '@/lib/settings';
import { credentialsSchema, settingsSchema } from '@/lib/validation';

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireVerifiedUser();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Some fields are invalid. Check the color and lengths.' };
  await saveSettings(user.id, parsed.data);
  revalidatePath('/settings');
  return { message: 'Settings saved.' };
}

export async function uploadLogoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireVerifiedUser();
  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image first.' };
  try {
    await setLogoPath(user.id, await saveLogo(user.id, Buffer.from(await file.arrayBuffer())));
  } catch (err) {
    if (err instanceof InvalidLogoError) return { error: err.message };
    throw err;
  }
  revalidatePath('/settings');
  return { message: 'Logo updated. New invoices will use it.' };
}

export async function removeLogoAction(): Promise<FormState> {
  const user = await requireVerifiedUser();
  await setLogoPath(user.id, null);
  revalidatePath('/settings');
  return { message: 'Logo removed.' };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireVerifiedUser();
  const next = credentialsSchema.shape.password.safeParse(formData.get('newPassword'));
  if (!next.success) return { error: 'New password must be at least 8 characters.' };
  const ok = await changePassword(user.id, String(formData.get('currentPassword') ?? ''), next.data);
  return ok ? { message: 'Password changed.' } : { error: 'Current password is wrong.' };
}
