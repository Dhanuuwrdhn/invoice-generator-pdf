import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { LoginForm } from '../forms';

export const metadata = { title: 'Sign in — Invoice PDF' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getCurrentUser()) redirect('/invoices');
  const { reset } = await searchParams;
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-4">Sign in</h1>
      {reset && <p className="text-sm text-[#0B5C42] mb-4">Password updated. Sign in with your new password.</p>}
      <LoginForm />
    </>
  );
}
