import { describe, expect, it } from 'vitest';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { invoiceDataSchema } from '@/lib/validation';

const valid = () => ({ ...emptyInvoiceData(), invoiceNumber: 'INV-1' });

describe('invoiceDataSchema', () => {
  it('accepts a minimal invoice', () => {
    expect(invoiceDataSchema.safeParse(valid()).success).toBe(true);
  });

  it('requires an invoice number', () => {
    expect(invoiceDataSchema.safeParse({ ...valid(), invoiceNumber: '  ' }).success).toBe(false);
  });

  it('rejects oversized payloads', () => {
    const item = valid().items[0];
    const many = Array.from({ length: 101 }, () => ({ ...item }));
    expect(invoiceDataSchema.safeParse({ ...valid(), items: many }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), clientAddress: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('rejects negative or non-finite numbers and bad colors/fonts', () => {
    const item = valid().items[0];
    expect(invoiceDataSchema.safeParse({ ...valid(), items: [{ ...item, qty: -1 }] }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), items: [{ ...item, price: Number.NaN }] }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), primaryColor: 'red;}' }).success).toBe(false);
    expect(invoiceDataSchema.safeParse({ ...valid(), fontFamily: 'Comic Sans' }).success).toBe(false);
  });

  it('strips unknown keys', () => {
    const parsed = invoiceDataSchema.parse({ ...valid(), logoPath: '../../etc/passwd' });
    expect('logoPath' in parsed).toBe(false);
  });
});
