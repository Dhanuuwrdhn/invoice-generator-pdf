import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#E7EBE2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-mono text-sm font-bold tracking-tight text-[#19261F] mb-6">
          INVOICE<span className="text-[#0B5C42]">·</span>PDF
        </Link>
        <div className="bg-white rounded-lg border border-[#C9D1C2] p-6">{children}</div>
        <Link href="/" className="mt-4 block text-center text-sm text-[#5C6A5E] hover:text-[#19261F]">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
