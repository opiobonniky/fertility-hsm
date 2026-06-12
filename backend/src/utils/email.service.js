import nodemailer from "nodemailer";
import { logger } from "./logger.js";

/**
 * Nodemailer transporter configured for Gmail SMTP.
 * Credentials from environment variables.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup (non-blocking)
transporter.verify().then(() => {
  logger.info("SMTP transporter ready — Gmail");
}).catch((err) => {
  logger.warn("SMTP transporter verification failed — emails will be logged only:", err.message);
});

/**
 * Send an email.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body (optional)
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@fertismart.com";

  try {
    const info = await transporter.sendMail({
      from: `"Life's Spring Women Center" <${from}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    logger.info(`Email sent to ${to}: "${subject}" (msgId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: "${subject}" — ${error.message}`);
    // Don't throw — email failure should not block the user creation flow
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email with login credentials to a newly registered staff user.
 */
export const sendWelcomeEmail = async ({ email, firstName, staffCode, password, roleLabel }) => {
  const subject = "Welcome to Life's Spring Women Center — Your Login Credentials";

  const text = `
Dear ${firstName},

Welcome to Life's Spring Women Center Fertility HMS.

Your account has been created. Here are your login credentials:

  Staff Code: ${staffCode}
  Password:   ${password}
  Role:       ${roleLabel}

Please log in at your earliest convenience and change your password.

Best regards,
Life's Spring Women Center Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #7c3aed; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Life's Spring Women Center</h1>
      <p style="color: #ddd; margin: 4px 0 0; font-size: 14px;">Fertility HMS</p>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="color: #333; margin: 0 0 16px;">Welcome, ${firstName}!</h2>
      <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">
        Your account has been created. Below are your login credentials.
        Please keep them confidential.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 12px; background: #f3f0ff; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; width: 40%;">Staff Code</td>
          <td style="padding: 10px 12px; background: #fafafa; border-radius: 0 6px 6px 0; font-family: monospace; color: #7c3aed; font-size: 16px;">${staffCode}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f3f0ff; font-weight: bold; color: #555;">Password</td>
          <td style="padding: 10px 12px; background: #fafafa; font-family: monospace; color: #7c3aed; font-size: 16px;">${password}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f3f0ff; border-radius: 0 0 0 6px; font-weight: bold; color: #555;">Role</td>
          <td style="padding: 10px 12px; background: #fafafa; border-radius: 0 0 6px 0; color: #555;">${roleLabel}</td>
        </tr>
      </table>
      <p style="color: #999; font-size: 13px; margin: 0;">
        Please log in and change your password at your earliest convenience.
      </p>
    </div>
    <div style="background: #f3f0ff; padding: 16px 24px; text-align: center; border-top: 1px solid #e8e0f0;">
      <p style="color: #888; font-size: 12px; margin: 0;">Life's Spring Women Center &bull; Fertility HMS</p>
    </div>
  </div>
</body>
</html>`.trim();

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send password reset email with a reset link containing a reset token.
 */
export const sendPasswordResetEmail = async ({ email, firstName, resetToken }) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
  const subject = "Life's Spring Women Center — Password Reset Request";

  const text = `
Dear ${firstName},

You recently requested to reset your password for the Life's Spring Women Center Fertility HMS.

Click the link below to reset your password. This link is valid for 15 minutes:

${resetUrl}

If you did not request a password reset, please ignore this email.

Best regards,
Life's Spring Women Center Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #7c3aed; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Life's Spring Women Center</h1>
      <p style="color: #ddd; margin: 4px 0 0; font-size: 14px;">Fertility HMS</p>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="color: #333; margin: 0 0 16px;">Password Reset Request</h2>
      <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">
        Hello ${firstName},
      </p>
      <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">
        We received a request to reset the password for your Life's Spring Women Center account.
        Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; padding: 14px 32px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
          Reset Password
        </a>
      </div>
      <p style="color: #999; font-size: 13px; margin: 0 0 16px;">
        If the button does not work, copy and paste this link into your browser:
      </p>
      <p style="color: #7c3aed; font-size: 12px; word-break: break-all; background: #f3f0ff; padding: 12px; border-radius: 6px; margin: 0 0 20px;">
        ${resetUrl}
      </p>
      <p style="color: #999; font-size: 13px; margin: 0;">
        If you did not request a password reset, please ignore this email.
      </p>
    </div>
    <div style="background: #f3f0ff; padding: 16px 24px; text-align: center; border-top: 1px solid #e8e0f0;">
      <p style="color: #888; font-size: 12px; margin: 0;">Life's Spring Women Center &bull; Fertility HMS</p>
    </div>
  </div>
</body>
</html>`.trim();

  return sendEmail({ to: email, subject, text, html });
};
