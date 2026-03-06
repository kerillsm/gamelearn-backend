import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildMentorProfileRemovedEmail(data: {
  to: string;
  userName: string;
  reason?: string;
}): EmailTemplate {
  const escapedUserName = escapeHtml(data.userName);
  const reasonSection = data.reason
    ? `
        <p style="font-size: 16px; margin-top: 16px;">Reason provided:</p>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; color: #333;">${escapeHtml(data.reason)}</p>
      `
    : "";

  const content = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #667eea; text-align: center; font-size: 24px;">Your mentor profile has been removed</h2>

        <p style="font-size: 16px; margin-top: 20px;">Hi <strong>${escapedUserName}</strong>,</p>

        <p>Your mentor profile on GameLearn has been removed by the administration.</p>
        ${reasonSection}

        <p style="margin-top: 24px;">
          GameLearn Team
        </p>
      </div>
    `;

  return {
    to: data.to,
    subject: "Your mentor profile has been removed",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
