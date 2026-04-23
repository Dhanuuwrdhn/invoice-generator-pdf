import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';
import { InvoiceData } from '@/types/invoice';

export async function POST(request: NextRequest) {
  const data: InvoiceData = await request.json();

  const element = React.createElement(InvoicePDF, { data }) as React.ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);

  const filename = `Invoice_${data.invoiceNumber.replace(/\//g, '-')}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
