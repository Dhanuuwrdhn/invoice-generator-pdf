import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { logoutAction } from '../actions';
import { ResendVerificationButton, VerifyForm } from '../forms';

export const metadata = { title: 'Verify email — Invoice PDF' };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (token) {
    return (
      <>
        <h1 className="text-lg font-semibold text-[#19261F] mb-4">Confirm your email</h1>
        <VerifyForm token={token} />
      </>
    );
  }
  const user = await getCurrentUser();
  if (user?.emailVerifiedAt) redirect('/invoices');
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-2">Check your email</h1>
      <p className="text-sm text-[#5C6A5E] mb-4">
        We sent a verification link{user ? ` to ${user.email}` : ''}. It expires in 1 hour.
      </p>
      <p className="text-sm text-[#5C6A5E] mb-4">
        Can&apos;t find it? Check your <strong>Spam</strong> or <strong>Promotions</strong> folder for an email
        from noreply@bornworks.biz.id.
      </p>
      {!user && (
        <p className="text-sm text-[#5C6A5E]">
          Still nothing?{' '}
          <Link href="/login" className="font-semibold text-[#0B5C42] underline">
            Sign in to resend the link
          </Link>
        </p>
      )}
      {user && (
        <div className="space-y-3">
          <ResendVerificationButton />
          <form action={logoutAction}>
            <button className="w-full text-sm text-[#5C6A5E] hover:text-[#19261F]">Sign out</button>
          </form>
        </div>
      )}
    </>
  );
}
