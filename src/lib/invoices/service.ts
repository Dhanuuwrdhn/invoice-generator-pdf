import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { invoices, type Invoice } from '@/db/schema';
import { chargeToken } from '@/lib/tokens';
import { invoiceDataSchema } from '@/lib/validation';
import type { InvoiceData } from '@/types/invoice';
import { isPaidEdit } from './rules';

export type RenderPdf = (data: InvoiceData, logoPath: string | null) => Promise<Buffer>;

export class InvoiceNotFoundError extends Error {
  constructor() {
    super('Invoice not found');
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Re-parse through the schema so key order is canonical before comparing.
function sameData(a: InvoiceData, b: InvoiceData): boolean {
  return JSON.stringify(invoiceDataSchema.parse(a)) === JSON.stringify(invoiceDataSchema.parse(b));
}

export async function createInvoice(
  userId: string,
  data: InvoiceData,
  logoPath: string | null,
  render: RenderPdf,
): Promise<{ id: string }> {
  const id = randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(invoices).values({ id, userId, invoiceNumber: data.invoiceNumber, data, logoPath });
    await chargeToken(tx, userId, 'invoice_create', id);
    // Rendering inside the transaction means a broken PDF never costs a token.
    await render(data, logoPath);
  });
  return { id };
}

export async function updateInvoice(
  userId: string,
  id: string,
  data: InvoiceData,
  render: RenderPdf,
): Promise<{ unchanged: boolean; editCount: number; charged: boolean }> {
  if (!UUID_RE.test(id)) throw new InvoiceNotFoundError();
  return getDb().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .for('update');
    if (!current) throw new InvoiceNotFoundError();
    if (sameData(current.data, data)) {
      return { unchanged: true, editCount: current.editCount, charged: false };
    }
    const editCount = current.editCount + 1;
    await tx
      .update(invoices)
      .set({ data, invoiceNumber: data.invoiceNumber, editCount, updatedAt: new Date() })
      .where(eq(invoices.id, id));
    const charged = isPaidEdit(editCount);
    if (charged) await chargeToken(tx, userId, 'invoice_edit', id);
    await render(data, current.logoPath);
    return { unchanged: false, editCount, charged };
  });
}

export async function getInvoice(userId: string, id: string): Promise<Invoice | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await getDb()
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  return row ?? null;
}

export async function listInvoices(userId: string) {
  return getDb()
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      clientCompany: sql<string>`${invoices.data}->>'clientCompany'`,
      editCount: invoices.editCount,
      updatedAt: invoices.updatedAt,
    })
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
}
