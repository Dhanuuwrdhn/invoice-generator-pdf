import { ForgotForm } from '../forms';

export const metadata = { title: 'Forgot password — Invoice PDF' };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-lg font-semibold text-[#19261F] mb-4">Reset your password</h1>
      <ForgotForm />
    </>
  );
}
