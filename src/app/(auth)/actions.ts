'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { clearSessionCookie, requireUser, setSessionCookie } from '@/lib/auth/current-user';
import { issueEmailToken } from '@/lib/auth/email-tokens';
import { sendAccountExistsEmail, sendResetEmail, sendVerificationEmail } from '@/lib/auth/emails';
import { authenticate, registerUser, requestPasswordReset, resetPassword, verifyEmail } from '@/lib/auth/service';
import { createSession, deleteSession, SESSION_COOKIE } from '@/lib/auth/session';
import { allowLoginAttempt, hitRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { credentialsSchema, loginSchema } from '@/lib/validation';

export type FormState = { error?: string; message?: string };

const TOO_MANY = 'Too many attempts. Please try again later.';

async function allowed(kind: keyof typeof RATE_LIMITS, suffix: string) {
  const { limit, windowSeconds } = RATE_LIMITS[kind];
  return hitRateLimit(`${kind}:${suffix}`, limit, windowSeconds);
}

async function ip() {
  return getClientIp(await headers());
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Enter a valid email and a password of at least 8 characters.' };
  if (!(await allowed('register', await ip()))) return { error: TOO_MANY };

  const result = await registerUser(parsed.data.email, parsed.data.password);
  try {
    if (result.kind === 'created') await sendVerificationEmail(parsed.data.email, result.verifyToken);
    else await sendAccountExistsEmail(parsed.data.email);
  } catch (err) {
    console.error('[register] mail failed', { userId: result.userId, err });
  }
  // Same response whether or not the email was already registered.
  redirect('/verify?sent=1');
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Invalid email or password.' };
  if (!(await allowLoginAttempt(await ip(), parsed.data.email))) return { error: TOO_MANY };

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { error: 'Invalid email or password.' };
  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  redirect(user.emailVerifiedAt ? '/invoices' : '/verify');
}

export async function verifyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get('token') ?? '');
  const userId = token ? await verifyEmail(token) : null;
  if (!userId) return { error: 'This link is invalid or has expired. Log in to request a new one.' };
  const session = await createSession(userId);
  await setSessionCookie(session.token, session.expiresAt);
  redirect('/invoices');
}

export async function resendVerificationAction(): Promise<FormState> {
  const user = await requireUser();
  if (user.emailVerifiedAt) redirect('/invoices');
  if (!(await allowed('resendVerification', user.id))) return { error: 'Please wait a minute before resending.' };
  try {
    await sendVerificationEmail(user.email, await issueEmailToken(user.id, 'verify'));
  } catch (err) {
    console.error('[resend-verification] mail failed', { userId: user.id, err });
    return { error: 'Could not send the email. Please try again.' };
  }
  return { message: 'Verification email sent.' };
}

export async function forgotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sent = { message: 'If that email is registered, a reset link is on its way.' };
  const parsed = loginSchema.shape.email.safeParse(formData.get('email'));
  if (!parsed.success) return { error: 'Enter a valid email.' };
  if (!(await allowed('forgot', await ip()))) return { error: TOO_MANY };
  const token = await requestPasswordReset(parsed.data);
  if (token) {
    try {
      await sendResetEmail(parsed.data, token);
    } catch (err) {
      console.error('[forgot] mail failed', { err });
    }
  }
  return sent;
}

export async function resetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get('token') ?? '');
  const password = credentialsSchema.shape.password.safeParse(formData.get('password'));
  if (!password.success) return { error: 'Password must be at least 8 characters.' };
  if (!(await allowed('reset', await ip()))) return { error: TOO_MANY };
  if (!token || !(await resetPassword(token, password.data))) {
    return { error: 'This link is invalid or has expired. Request a new one.' };
  }
  redirect('/login?reset=1');
}

export async function logoutAction(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  await clearSessionCookie();
  redirect('/login');
}
