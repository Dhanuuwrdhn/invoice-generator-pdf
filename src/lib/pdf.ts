import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';
import type { InvoiceData } from '@/types/invoice';

export async function renderInvoicePdf(
  data: InvoiceData,
  logo: { data: Buffer; format: 'png' | 'jpg' } | null,
): Promise<Buffer> {
  const element = React.createElement(InvoicePDF, { data, logo }) as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
