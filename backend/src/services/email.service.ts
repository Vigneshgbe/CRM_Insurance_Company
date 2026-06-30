import nodemailer from 'nodemailer';

// ── Gmail SMTP transport ────────────────────────────────────────────────────
// Requires EMAIL_USER and EMAIL_APP_PASSWORD in .env
// EMAIL_APP_PASSWORD must be a Gmail "App Password" (not your normal Gmail password)
// Generate one at: https://myaccount.google.com/apppasswords

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export interface SendEmailParams {
  to: string;
  cc?: string;
  subject: string;
  body: string; // plain text or simple HTML
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, cc, subject, body } = params;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    return { success: false, error: 'EMAIL_USER or EMAIL_APP_PASSWORD not set in .env' };
  }

  try {
    await transporter.sendMail({
      from: `"Matrix Legal Services" <${process.env.EMAIL_USER}>`,
      to,
      cc: cc || undefined,
      subject,
      html: body.replace(/\n/g, '<br>'),
      text: body,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[email.service] sendEmail failed:', err.message);
    return { success: false, error: err.message };
  }
}

export function getFromEmail(): string {
  return process.env.EMAIL_USER || '';
}