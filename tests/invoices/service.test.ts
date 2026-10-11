import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { invoices, tokenLedger, users } from '@/db/schema';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import {
  createInvoice,
  getInvoice,
  getInvoicePdf,
  InvoiceNotFoundError,
  listInvoices,
  updateInvoice,
} from '@/lib/invoices/service';
import { OutOfTokensError } from '@/lib/tokens';
import { ledgerSum, makeUser, resetDb } from '../helpers/db';

const render = async () => Buffer.from('%PDF-stub');
const failingRender = async (): Promise<Buffer> => {
  throw new Error('render failed');
};
// Counts calls and returns bytes that name the version, so tests can tell which render was stored.
function countingRender() {
  const fn = async (d: { invoiceNumber: string }) => {
    fn.calls++;
    return Buffer.from(`%PDF-${d.invoiceNumber}`);
  };
  fn.calls = 0;
  return fn;
}
const data = (n = 'INV-1') => ({ ...emptyInvoiceData(), invoiceNumber: n });

async function balance(userId: string) {
  const [u] = await getDb().select().from(users).where(eq(users.id, userId));
  return u.tokenBalance;
}

describe('invoice service', () => {
  beforeEach(resetDb);

  it('charges one token to create', async () => {
    const user = await makeUser('a@example.com', { balance: 3 });
    const { id } = await createInvoice(user.id, data(), null, render);
    expect(await balance(user.id)).toBe(2);
    const ledger = await getDb().select().from(tokenLedger).where(eq(tokenLedger.invoiceId, id));
    expect(ledger.map((l) => [l.delta, l.reason])).toEqual([[-1, 'invoice_create']]);
    expect(await ledgerSum(user.id)).toBe(2);
  });

  it('refuses to create with zero balance and saves nothing', async () => {
    const user = await makeUser('a@example.com', { balance: 0 });
    await expect(createInvoice(user.id, data(), null, render)).rejects.toBeInstanceOf(OutOfTokensError);
    expect(await getDb().select().from(invoices)).toHaveLength(0);
  });

  it('rolls back the token when rendering fails', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    await expect(createInvoice(user.id, data(), null, failingRender)).rejects.toThrow('render failed');
    expect(await balance(user.id)).toBe(1);
    expect(await getDb().select().from(invoices)).toHaveLength(0);
  });

  it('makes edits 1-5 free, charges the 6th and 12th', async () => {
    const user = await makeUser('a@example.com', { balance: 3 });
    const { id } = await createInvoice(user.id, data(), null, render);
    const charged: boolean[] = [];
    for (let i = 1; i <= 12; i++) {
      const r = await updateInvoice(user.id, id, data(`INV-1-v${i}`), render);
      expect(r.editCount).toBe(i);
      charged.push(r.charged);
    }
    expect(charged.map((c, i) => (c ? i + 1 : 0)).filter(Boolean)).toEqual([6, 12]);
    expect(await balance(user.id)).toBe(0);
    expect(await ledgerSum(user.id)).toBe(0);
  });

  it('does not count saving unchanged data', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    // Same object twice: item ids are random per data() call, like a real form re-submitting its own items.
    const saved = data();
    const { id } = await createInvoice(user.id, saved, null, render);
    const r = await updateInvoice(user.id, id, structuredClone(saved), render);
    expect(r).toEqual({ unchanged: true, editCount: 0, charged: false });
  });

  it('blocks a paid edit at zero balance and keeps the old version', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    const { id } = await createInvoice(user.id, data(), null, render);
    for (let i = 1; i <= 5; i++) await updateInvoice(user.id, id, data(`v${i}`), render);
    await expect(updateInvoice(user.id, id, data('v6'), render)).rejects.toBeInstanceOf(OutOfTokensError);
    const inv = await getInvoice(user.id, id);
    expect(inv?.data.invoiceNumber).toBe('v5');
    expect(inv?.editCount).toBe(5);
  });

  it('lets exactly one of two concurrent paid edits through', async () => {
    const user = await makeUser('a@example.com', { balance: 2 });
    const a = await createInvoice(user.id, data('A'), null, render);
    const b = await createInvoice(user.id, data('B'), null, render);
    // balance now 0; top up to exactly 1 and bring both invoices to edit 5
    await getDb().update(users).set({ tokenBalance: 1 }).where(eq(users.id, user.id));
    await getDb().insert(tokenLedger).values({ userId: user.id, delta: 1, reason: 'admin_topup' });
    for (let i = 1; i <= 5; i++) {
      await updateInvoice(user.id, a.id, data(`A${i}`), render);
      await updateInvoice(user.id, b.id, data(`B${i}`), render);
    }
    const results = await Promise.allSettled([
      updateInvoice(user.id, a.id, data('A6'), render),
      updateInvoice(user.id, b.id, data('B6'), render),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await balance(user.id)).toBe(0);
    expect(await ledgerSum(user.id)).toBe(0);
  });

  it('hides other users invoices', async () => {
    const owner = await makeUser('a@example.com', { balance: 1 });
    const other = await makeUser('b@example.com', { balance: 1 });
    const { id } = await createInvoice(owner.id, data(), null, render);
    expect(await getInvoice(other.id, id)).toBeNull();
    expect(await getInvoice(owner.id, 'not-a-uuid')).toBeNull();
    await expect(updateInvoice(other.id, id, data('x'), render)).rejects.toBeInstanceOf(InvoiceNotFoundError);
    expect(await listInvoices(other.id)).toEqual([]);
    expect((await listInvoices(owner.id)).map((i) => i.id)).toEqual([id]);
  });

  it('rolls back a paid edit and its token when rendering fails', async () => {
    const user = await makeUser('a@example.com', { balance: 2 });
    const { id } = await createInvoice(user.id, data(), null, render);
    for (let i = 1; i <= 5; i++) await updateInvoice(user.id, id, data(`v${i}`), render);
    await expect(updateInvoice(user.id, id, data('v6'), failingRender)).rejects.toThrow('render failed');
    const inv = await getInvoice(user.id, id);
    expect(inv?.data.invoiceNumber).toBe('v5');
    expect(inv?.editCount).toBe(5);
    expect(await balance(user.id)).toBe(1);
    expect(await ledgerSum(user.id)).toBe(1);
  });

  it('serves the PDF rendered at save time without rendering again', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    const r = countingRender();
    const { id } = await createInvoice(user.id, data('INV-7'), null, r);
    expect(r.calls).toBe(1);
    const download = countingRender();
    const pdf = await getInvoicePdf(user.id, id, download);
    expect(pdf).toEqual({ invoiceNumber: 'INV-7', pdf: Buffer.from('%PDF-INV-7') });
    expect(download.calls).toBe(0);
  });

  it('replaces the stored PDF on edit and skips rendering unchanged saves', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    const saved = data('INV-1');
    const { id } = await createInvoice(user.id, saved, null, render);
    const r = countingRender();
    await updateInvoice(user.id, id, structuredClone(saved), r);
    expect(r.calls).toBe(0);
    await updateInvoice(user.id, id, data('INV-2'), r);
    expect(r.calls).toBe(1);
    expect((await getInvoicePdf(user.id, id, failingRender))?.pdf).toEqual(Buffer.from('%PDF-INV-2'));
  });

  it('renders and stores a PDF once for invoices saved before PDFs were stored', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    const { id } = await createInvoice(user.id, data('OLD'), null, render);
    await getDb().update(invoices).set({ pdf: null }).where(eq(invoices.id, id));
    const r = countingRender();
    expect((await getInvoicePdf(user.id, id, r))?.pdf).toEqual(Buffer.from('%PDF-OLD'));
    expect((await getInvoicePdf(user.id, id, r))?.pdf).toEqual(Buffer.from('%PDF-OLD'));
    expect(r.calls).toBe(1);
  });

  it('does not serve other users PDFs', async () => {
    const owner = await makeUser('a@example.com', { balance: 1 });
    const other = await makeUser('b@example.com');
    const { id } = await createInvoice(owner.id, data(), null, render);
    expect(await getInvoicePdf(other.id, id, render)).toBeNull();
    expect(await getInvoicePdf(owner.id, 'not-a-uuid', render)).toBeNull();
  });

  it('creates one invoice for two concurrent requests with the same idempotency key', async () => {
    const user = await makeUser('a@example.com', { balance: 3 });
    const key = randomUUID();
    const [a, b] = await Promise.all([
      createInvoice(user.id, data(), null, render, key),
      createInvoice(user.id, data(), null, render, key),
    ]);
    expect(a.id).toBe(b.id);
    expect([a.created, b.created].sort()).toEqual([false, true]);
    expect(await getDb().select().from(invoices)).toHaveLength(1);
    expect(await getDb().select().from(tokenLedger).where(eq(tokenLedger.reason, 'invoice_create'))).toHaveLength(1);
    expect(await balance(user.id)).toBe(2);
    expect(await ledgerSum(user.id)).toBe(2);
  });

  it('returns the first invoice for a retried key without charging again', async () => {
    const user = await makeUser('a@example.com', { balance: 3 });
    const key = randomUUID();
    const first = await createInvoice(user.id, data('INV-1'), null, render, key);
    const retry = await createInvoice(user.id, data('INV-1'), null, render, key);
    expect(retry).toEqual({ id: first.id, created: false });
    expect(await balance(user.id)).toBe(2);
  });

  it('scopes idempotency keys per user and treats new keys as new invoices', async () => {
    const owner = await makeUser('a@example.com', { balance: 3 });
    const other = await makeUser('b@example.com', { balance: 3 });
    const key = randomUUID();
    const a = await createInvoice(owner.id, data(), null, render, key);
    const b = await createInvoice(other.id, data(), null, render, key);
    const c = await createInvoice(owner.id, data(), null, render, randomUUID());
    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    expect(await balance(owner.id)).toBe(1);
    expect(await balance(other.id)).toBe(2);
  });

  it('lets a retry through after the first attempt with that key failed', async () => {
    const user = await makeUser('a@example.com', { balance: 1 });
    const key = randomUUID();
    await expect(createInvoice(user.id, data(), null, failingRender, key)).rejects.toThrow('render failed');
    const retry = await createInvoice(user.id, data(), null, render, key);
    expect(retry.created).toBe(true);
    expect(await balance(user.id)).toBe(0);
    expect(await ledgerSum(user.id)).toBe(0);
  });
});
