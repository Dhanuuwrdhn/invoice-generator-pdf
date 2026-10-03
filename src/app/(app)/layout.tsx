import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { isAdminEmail } from '@/lib/auth/admin-emails';
import { requireVerifiedUser } from '@/lib/auth/current-user';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVerifiedUser();
  return (
    <div className="min-h-screen bg-[#E7EBE2]">
      <header className="border-b border-[#C9D1C2] bg-[#E7EBE2]">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-4 text-sm">
          <Link href="/invoices" className="font-mono font-bold tracking-tight text-[#19261F]">
            INVOICE<span className="text-[#0B5C42]">·</span>PDF
          </Link>
          <nav className="flex gap-3 text-[#5C6A5E]">
            <Link href="/" className="hover:text-[#19261F]">Home</Link>
            <Link href="/invoices" className="hover:text-[#19261F]">Invoices</Link>
            <Link href="/settings" className="hover:text-[#19261F]">Settings</Link>
            {isAdminEmail(user.email) && <Link href="/admin" className="hover:text-[#19261F]">Admin</Link>}
          </nav>
          <span className="ml-auto font-mono text-xs text-[#19261F]" data-testid="token-balance">
            {user.tokenBalance} tokens
          </span>
          <span className="hidden sm:inline text-xs text-[#5C6A5E]">{user.email}</span>
          <form action={logoutAction}>
            <button className="text-xs text-[#5C6A5E] hover:text-[#19261F]">Sign out</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
