import { notFound } from 'next/navigation';
import { InvoiceForm } from '@/components/InvoiceForm';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { getInvoice } from '@/lib/invoices/service';
import { listTemplates } from '@/lib/templates';

export const metadata = { title: 'Edit invoice — Invoice PDF' };

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireVerifiedUser();
  const { id } = await params;
  const invoice = await getInvoice(user.id, id);
  if (!invoice) notFound();
  return (
    <InvoiceForm
      mode="edit"
      invoiceId={invoice.id}
      editCount={invoice.editCount}
      initialData={invoice.data}
      templates={await listTemplates(user.id)}
    />
  );
}
