import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildEmailVerificationEmail(data: {
  to: string;
  userName: string;
  verificationLink: string;
}): EmailTemplate {
  const content = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #667eea; text-align: center; font-size: 24px;">Verify your email</h2>

        <p style="font-size: 16px; margin-top: 20px;">Hi <strong>${data.userName}</strong>,</p>

        <p>You requested to change your email address. Please confirm by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify email</a>
        </div>

        <p style="color: #666; font-size: 14px;">If you did not request this change, you can ignore this email.</p>

        <p style="margin-top: 24px;">
          GameLearn Team
        </p>
      </div>
    `;

  return {
    to: data.to,
    subject: "Verify your email address",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
