import { InvoiceForm } from '@/components/InvoiceForm';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { getSettings, settingsToInvoiceDefaults } from '@/lib/settings';
import { listTemplates } from '@/lib/templates';

export const metadata = { title: 'New invoice — Invoice PDF' };

export default async function NewInvoicePage() {
  const user = await requireVerifiedUser();
  const [settings, templates] = await Promise.all([getSettings(user.id), listTemplates(user.id)]);
  const initialData = { ...emptyInvoiceData(), ...settingsToInvoiceDefaults(settings) };
  return <InvoiceForm mode="new" initialData={initialData} templates={templates} />;
}
