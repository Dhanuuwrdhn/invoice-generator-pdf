'use server';

import { revalidatePath } from 'next/cache';
import { topUpTokens } from '@/lib/admin';
import { requireAdmin } from '@/lib/auth/current-user';

// The amount input is constrained to 1-1000 in the browser; the updated balance
// in the list is the confirmation, and topUpTokens still enforces the range.
export async function topUpAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const amount = Number(formData.get('amount'));
  await topUpTokens(admin.id, userId, amount);
  revalidatePath('/admin');
}
