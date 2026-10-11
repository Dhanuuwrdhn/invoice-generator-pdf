import { getCurrentUser } from '@/lib/auth/current-user';
import { getInvoicePdf, type RenderPdf } from '@/lib/invoices/service';
import { readLogo } from '@/lib/logo';
import { renderInvoicePdf } from '@/lib/pdf';

const render: RenderPdf = async (data, logoPath) => renderInvoicePdf(data, await readLogo(logoPath));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return new Response('Unauthorized', { status: 401 });
  const invoice = await getInvoicePdf(user.id, (await params).id, render);
  if (!invoice) return new Response('Not found', { status: 404 });

  const filename = `Invoice_${invoice.invoiceNumber.replace(/[^A-Za-z0-9._-]/g, '-')}.pdf`;
  return new Response(new Uint8Array(invoice.pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
