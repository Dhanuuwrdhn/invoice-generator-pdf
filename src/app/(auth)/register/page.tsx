import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { RegisterForm } from '../forms';

export const metadata = { title: 'Create account — Invoice PDF' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/invoices');
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-1">Create account</h1>
      <p className="text-sm text-[#5C6A5E] mb-4">Verify your email to get 10 free tokens.</p>
      <RegisterForm />
    </>
  );
}
