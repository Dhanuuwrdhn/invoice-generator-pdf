'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  forgotAction,
  loginAction,
  registerAction,
  resendVerificationAction,
  resetAction,
  verifyAction,
  type FormState,
} from './actions';

const input =
  'w-full border border-[#BCC6B6] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5C42]/30';
const button =
  'w-full py-2.5 rounded-md bg-[#0B5C42] text-[#F6F7F1] font-mono text-[13px] font-bold tracking-tight hover:bg-[#094B36] disabled:opacity-50';
const label = 'block font-mono text-[10px] font-bold text-[#5C6A5E] mb-1.5 uppercase tracking-[0.14em]';

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state.message) return <p className="text-sm text-[#0B5C42]">{state.message}</p>;
  return null;
}

function EmailField() {
  return (
    <div>
      <label htmlFor="email" className={label}>Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required className={input} />
    </div>
  );
}

function PasswordField({ autoComplete, label: text = 'Password' }: { autoComplete: string; label?: string }) {
  return (
    <div>
      <label htmlFor="password" className={label}>{text}</label>
      <input id="password" name="password" type="password" autoComplete={autoComplete} minLength={8} required className={input} />
    </div>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <EmailField />
      <PasswordField autoComplete="current-password" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SIGNING IN…' : 'SIGN IN'}</button>
      <div className="flex justify-between text-sm text-[#5C6A5E]">
        <Link href="/register" className="hover:text-[#19261F]">Create account</Link>
        <Link href="/forgot" className="hover:text-[#19261F]">Forgot password?</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <EmailField />
      <PasswordField autoComplete="new-password" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'CREATING…' : 'CREATE ACCOUNT'}</button>
      <p className="text-sm text-[#5C6A5E]">
        Already registered? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </form>
  );
}

export function VerifyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'VERIFYING…' : 'VERIFY EMAIL'}</button>
    </form>
  );
}

export function ResendVerificationButton() {
  const [state, action, pending] = useActionState(resendVerificationAction, {});
  return (
    <form action={action} className="space-y-3">
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SENDING…' : 'RESEND EMAIL'}</button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotAction, {});
  return (
    <form action={action} className="space-y-4">
      <EmailField />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SENDING…' : 'SEND RESET LINK'}</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <PasswordField autoComplete="new-password" label="New password" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? 'SAVING…' : 'SET PASSWORD'}</button>
    </form>
  );
}
