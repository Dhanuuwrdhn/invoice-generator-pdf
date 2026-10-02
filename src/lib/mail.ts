import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  return (transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || '465'),
    secure: (process.env.SMTP_PORT || '465') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }));
}

// Without SMTP_HOST (local dev, E2E) mails are printed instead of sent.
export async function sendMail(msg: { to: string; subject: string; text: string }): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.info(`[mail:dev] to=${msg.to} subject=${msg.subject}\n${msg.text}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM ?? 'Bornworks Invoice <noreply@bornworks.biz.id>',
    ...msg,
  });
}
