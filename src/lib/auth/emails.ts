import { sendMail } from '@/lib/mail';

const appUrl = () => process.env.APP_URL ?? 'http://localhost:3000';

export function sendVerificationEmail(to: string, token: string) {
  return sendMail({
    to,
    subject: 'Verify your email — Invoice PDF',
    text: `Confirm your email to get 10 free tokens:\n\n${appUrl()}/verify?token=${token}\n\nThis link expires in 1 hour.`,
  });
}

export function sendResetEmail(to: string, token: string) {
  return sendMail({
    to,
    subject: 'Reset your password — Invoice PDF',
    text: `Set a new password:\n\n${appUrl()}/reset?token=${token}\n\nThis link expires in 1 hour. If you did not ask for this, ignore this email.`,
  });
}

export function sendAccountExistsEmail(to: string) {
  return sendMail({
    to,
    subject: 'You already have an account — Invoice PDF',
    text: `Someone tried to register with this email, but it already has an account.\n\nLog in: ${appUrl()}/login\nForgot your password? ${appUrl()}/forgot`,
  });
}
