import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db';
import { invoices, tokenLedger, users } from '@/db/schema';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import {
  createInvoice,
  getInvoice,
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
});
