import Link from 'next/link';
import { requireVerifiedUser } from '@/lib/auth/current-user';
import { listInvoices } from '@/lib/invoices/service';

export const metadata = { title: 'Invoices — Invoice PDF' };

export default async function InvoicesPage() {
  const user = await requireVerifiedUser();
  const rows = await listInvoices(user.id);
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#19261F]">Invoices</h1>
        <Link
          href="/invoices/new"
          className="px-4 py-2 rounded-md bg-[#0B5C42] text-[#F6F7F1] font-mono text-[13px] font-bold hover:bg-[#094B36]"
        >
          NEW INVOICE
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[#5C6A5E]">No invoices yet. Creating one uses 1 token.</p>
      ) : (
        <div className="bg-white rounded-lg border border-[#C9D1C2] divide-y divide-[#D7DDCF]">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-3 flex items-center gap-4 text-sm">
              <Link href={`/invoices/${r.id}`} className="font-mono font-semibold text-[#19261F] hover:underline">
                {r.invoiceNumber}
              </Link>
              <span className="text-[#5C6A5E] truncate">{r.clientCompany}</span>
              <span className="ml-auto text-xs text-[#8A9587]">
                {r.editCount} edits · {r.updatedAt.toLocaleDateString('id-ID')}
              </span>
              <a href={`/invoices/${r.id}/pdf`} className="text-xs font-semibold text-[#0B5C42] hover:underline">
                PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
