import { describe, expect, it } from 'vitest';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { renderInvoicePdf } from '@/lib/pdf';

// Valid 1x1 PNG.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('renderInvoicePdf', () => {
  it('renders a PDF without a logo', async () => {
    const buf = await renderInvoicePdf({ ...emptyInvoiceData(), invoiceNumber: 'INV-1' }, null);
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('renders a PDF with a PNG logo', async () => {
    const buf = await renderInvoicePdf(
      { ...emptyInvoiceData(), invoiceNumber: 'INV-1' },
      { data: PNG_1x1, format: 'png' },
    );
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
