import { ResetForm } from '../forms';

export const metadata = { title: 'Set new password — Invoice PDF' };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-4">Set a new password</h1>
      {token ? <ResetForm token={token} /> : <p className="text-sm text-red-700">Missing reset token.</p>}
    </>
  );
}
