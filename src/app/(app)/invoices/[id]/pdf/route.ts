import { getCurrentUser } from '@/lib/auth/current-user';
import { getInvoice } from '@/lib/invoices/service';
import { readLogo } from '@/lib/logo';
import { renderInvoicePdf } from '@/lib/pdf';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return new Response('Unauthorized', { status: 401 });
  const invoice = await getInvoice(user.id, (await params).id);
  if (!invoice) return new Response('Not found', { status: 404 });

  const pdf = await renderInvoicePdf(invoice.data, await readLogo(invoice.logoPath));
  const filename = `Invoice_${invoice.invoiceNumber.replace(/[^A-Za-z0-9._-]/g, '-')}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
