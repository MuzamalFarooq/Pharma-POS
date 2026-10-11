import nodemailer from 'nodemailer';

/**
 * Returns the trusted base URL for the application.
 * Never relies on untrusted request Host headers to prevent Host Header Poisoning.
 */
export function getAppBaseUrl() {
  const configured =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (configured && configured.trim()) {
    let url = configured.trim().replace(/\/+$/, '');
    if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    return url;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://pharmapulse.muzamal.site';
  }

  return 'http://localhost:3000';
}

/**
 * Creates and caches the Nodemailer transporter instance
 */
let cachedTransporter = null;

export function getEmailTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host =
    process.env.SMTP_HOST ||
    process.env.EMAIL_SERVER_HOST ||
    'smtp.gmail.com';
  const port = Number(
    process.env.SMTP_PORT ||
    process.env.EMAIL_SERVER_PORT ||
    465
  );
  const secure =
    port === 465 ||
    process.env.SMTP_SECURE === 'true' ||
    process.env.EMAIL_SERVER_SECURE === 'true';

  const user =
    process.env.SMTP_USER ||
    process.env.EMAIL_SERVER_USER ||
    process.env.GMAIL_USER;
  const pass =
    process.env.SMTP_PASS ||
    process.env.EMAIL_SERVER_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Production timeouts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return cachedTransporter;
}

/**
 * Sends a password reset email with a single-use 15-minute token link
 */
export async function sendPasswordResetEmail({ to, name, rawToken }) {
  const baseUrl = getAppBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    `"PharmaPulse Security" <${process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || 'noreply@pharmapulse.muzamal.site'}>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your PharmaPulse Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #059669; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">PharmaPulse</h1>
      <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Pharmacy Management & POS Cloud</p>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0;">
        Hello ${name ? name : 'there'},<br><br>
        We received a request to reset your password for your PharmaPulse account. Click the button below to set a new password:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #059669; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; display: inline-block; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
          Reset Password
        </a>
      </div>
      <p style="font-size: 12px; line-height: 18px; color: #64748b; margin: 20px 0 0 0;">
        <strong>Security Notice:</strong> This single-use link will expire in <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email; your existing password will remain unchanged.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;">
      <p style="font-size: 11px; line-height: 16px; color: #94a3b8; word-break: break-all; margin: 0;">
        Button not working? Copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #059669; text-decoration: underline;">${resetUrl}</a>
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
        &copy; ${new Date().getFullYear()} PharmaPulse SaaS. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
PharmaPulse - Password Reset Request

Hello ${name ? name : 'there'},

We received a request to reset your password for your PharmaPulse account.
Use the following link to reset your password:
${resetUrl}

This single-use link expires in 15 minutes.
If you did not request this reset, you can safely ignore this email.
  `.trim();

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.info(`[Email Service] SMTP credentials not set. Simulated reset email to: ${to}`);
    return { success: true, simulated: true, resetUrl };
  }

  await transporter.sendMail({
    from,
    to,
    subject: 'PharmaPulse - Reset Your Password',
    text,
    html,
  });

  return { success: true, simulated: false };
}

/**
 * Sends a password change confirmation email
 * Never includes the new password
 */
export async function sendPasswordChangeConfirmationEmail({ to, name }) {
  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    `"PharmaPulse Security" <${process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || 'noreply@pharmapulse.muzamal.site'}>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #059669; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">PharmaPulse</h1>
      <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Security Notification</p>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Your Password Was Changed</h2>
      <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 16px 0;">
        Hello ${name ? name : 'there'},<br><br>
        This email confirms that the password for your PharmaPulse account (${to}) was successfully updated on ${new Date().toUTCString()}.
      </p>
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; padding: 14px; margin: 20px 0;">
        <p style="color: #991b1b; font-size: 12px; margin: 0; line-height: 18px;">
          <strong>Didn't make this change?</strong><br>
          If you did not change your password, please contact our support team immediately or request another password reset to secure your account.
        </p>
      </div>
      <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 16px 0 0 0;">
        Existing sessions have been revoked for your security. Please sign in with your new password.
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
        &copy; ${new Date().getFullYear()} PharmaPulse SaaS. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
PharmaPulse - Password Changed Successfully

Hello ${name ? name : 'there'},

This is a confirmation that your PharmaPulse account password was updated on ${new Date().toUTCString()}.

If you did not perform this change, please contact support or immediately reset your password.
  `.trim();

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.info(`[Email Service] SMTP credentials not set. Simulated password changed notice to: ${to}`);
    return { success: true, simulated: true };
  }

  await transporter.sendMail({
    from,
    to,
    subject: 'PharmaPulse - Your Password Has Been Changed',
    text,
    html,
  });

  return { success: true, simulated: false };
}
