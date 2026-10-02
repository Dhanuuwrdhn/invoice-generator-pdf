'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { createInvoice, InvoiceNotFoundError, updateInvoice, type RenderPdf } from '@/lib/invoices/service';
import { readLogo } from '@/lib/logo';
import { renderInvoicePdf } from '@/lib/pdf';
import { getSettings } from '@/lib/settings';
import { deleteTemplate, listTemplates, saveTemplate, type SavedTemplate } from '@/lib/templates';
import { OutOfTokensError } from '@/lib/tokens';
import { invoiceDataSchema } from '@/lib/validation';

export type SaveResult =
  | { ok: true; id: string; editCount: number; charged: boolean; unchanged: boolean }
  | { ok: false; error: string };

export type TemplateResult = { ok: true; templates: SavedTemplate[] } | { ok: false; error: string };

const OUT_OF_TOKENS = 'You are out of tokens. Ask an admin to top up your balance.';
const GENERIC = 'Something went wrong. Please try again.';

const render: RenderPdf = async (data, logoPath) => renderInvoicePdf(data, await readLogo(logoPath));

function invalid(error: z.ZodError): { ok: false; error: string } {
  const issue = error.issues[0];
  return { ok: false, error: `Invalid field "${issue.path.join('.')}": ${issue.message}` };
}

export async function createInvoiceAction(input: unknown): Promise<SaveResult> {
  const user = await requireVerifiedUser();
  const parsed = invoiceDataSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { logoPath } = await getSettings(user.id);
    const { id } = await createInvoice(user.id, parsed.data, logoPath, render);
    revalidatePath('/', 'layout');
    return { ok: true, id, editCount: 0, charged: true, unchanged: false };
  } catch (err) {
    if (err instanceof OutOfTokensError) return { ok: false, error: OUT_OF_TOKENS };
    console.error('[createInvoice]', { userId: user.id, err });
    return { ok: false, error: GENERIC };
  }
}

export async function updateInvoiceAction(id: string, input: unknown): Promise<SaveResult> {
  const user = await requireVerifiedUser();
  const parsed = invoiceDataSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const r = await updateInvoice(user.id, id, parsed.data, render);
    revalidatePath('/', 'layout');
    return { ok: true, id, ...r };
  } catch (err) {
    if (err instanceof OutOfTokensError) return { ok: false, error: OUT_OF_TOKENS };
    if (err instanceof InvoiceNotFoundError) return { ok: false, error: 'Invoice not found.' };
    console.error('[updateInvoice]', { userId: user.id, invoiceId: id, err });
    return { ok: false, error: GENERIC };
  }
}

export async function saveTemplateAction(name: string, input: unknown): Promise<TemplateResult> {
  const user = await requireVerifiedUser();
  const parsedName = z.string().trim().min(1).max(100).safeParse(name);
  // Templates may be saved before an invoice number exists, so relax only that field.
  const parsed = invoiceDataSchema.extend({ invoiceNumber: z.string().max(100) }).safeParse(input);
  if (!parsedName.success) return { ok: false, error: 'Template name is required.' };
  if (!parsed.success) return invalid(parsed.error);
  await saveTemplate(user.id, parsedName.data, parsed.data);
  return { ok: true, templates: await listTemplates(user.id) };
}

export async function deleteTemplateAction(id: string): Promise<TemplateResult> {
  const user = await requireVerifiedUser();
  await deleteTemplate(user.id, id);
  return { ok: true, templates: await listTemplates(user.id) };
}
