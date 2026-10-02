import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { templates } from '@/db/schema';
import type { InvoiceData } from '@/types/invoice';

export type SavedTemplate = { id: string; name: string; data: InvoiceData };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listTemplates(userId: string): Promise<SavedTemplate[]> {
  return getDb()
    .select({ id: templates.id, name: templates.name, data: templates.data })
    .from(templates)
    .where(eq(templates.userId, userId))
    .orderBy(asc(templates.createdAt));
}

export async function saveTemplate(userId: string, name: string, data: InvoiceData): Promise<void> {
  await getDb().insert(templates).values({ userId, name, data });
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  await getDb().delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
}
