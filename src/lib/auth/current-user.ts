import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import type { User } from '@/db/schema';
import { isAdminEmail } from './admin-emails';
import { getUserBySessionToken, SESSION_COOKIE } from './session';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getUserBySessionToken(token) : null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireVerifiedUser(): Promise<User> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect('/verify');
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireVerifiedUser();
  if (!isAdminEmail(user.email)) notFound();
  return user;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
