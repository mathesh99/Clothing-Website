import { config } from '../config';
import { logger } from './logger';

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    logger.warn('Brevo API key not configured — skipping send');
    return;
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || ''
      },
      body: JSON.stringify({
        sender: { name: "He & She", email: process.env.SMTP_USER || 'hello@heandshe.com' },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
}

export function passwordResetEmailTemplate(resetUrl: string, firstName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f5f0e8; margin: 0; padding: 40px 0; }
        .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 4px; overflow: hidden; }
        .header { background: #0f0f0f; padding: 32px; text-align: center; }
        .header h1 { color: #c9a96e; margin: 0; font-size: 28px; letter-spacing: 6px; }
        .body { padding: 40px; }
        .body p { color: #444; line-height: 1.6; }
        .btn { display: inline-block; background: #0f0f0f; color: #fff; padding: 14px 32px;
               text-decoration: none; border-radius: 2px; margin: 24px 0; font-size: 14px; letter-spacing: 1px; }
        .footer { padding: 24px 40px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header"><h1>VELOUR</h1></div>
          <div class="body">
            <p>Hello, ${firstName}.</p>
            <p>We received a request to reset your VELOUR account password. Click the button below to set a new password:</p>
            <a href="${resetUrl}" class="btn">Reset Password</a>
            <p>This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">© ${new Date().getFullYear()} VELOUR. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;
}
