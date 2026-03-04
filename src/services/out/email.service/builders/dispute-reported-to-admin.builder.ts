import { User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildDisputeReportedToAdminEmail(data: {
  adminEmail: string;
  applicant: User;
  mentor: User;
  sessionPackageId: string;
  reporterRole: "applicant" | "mentor";
  reason: string;
  frontendUrl?: string;
}): EmailTemplate {
  const reportedBy =
    data.reporterRole === "applicant"
      ? `Applicant: ${data.applicant.name} (${data.applicant.email})`
      : `Mentor: ${data.mentor.name} (${data.mentor.email})`;

  const escapedReason = data.reason
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const content = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #ff9966; text-align: center; font-size: 24px;">⚠️ Dispute reported</h2>

        <p style="font-size: 16px; margin-top: 20px;">A dispute has been opened for a completed session package.</p>

        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>Session package ID:</strong> ${data.sessionPackageId}<br/>
            <strong>Applicant:</strong> ${data.applicant.name} (${data.applicant.email})<br/>
            <strong>Mentor:</strong> ${data.mentor.name} (${data.mentor.email})<br/>
            <strong>Reported by:</strong> ${reportedBy}
          </p>
        </div>
        <div style="background: #f5f5f5; border-left: 4px solid #999; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${escapedReason}</p>
        </div>

        <p style="margin-top: 24px;">
          Please review and resolve the dispute according to the platform rules.
        </p>

        <p style="margin-top: 20px;">
          GameLearn Admin
        </p>
      </div>
    `;

  return {
    to: data.adminEmail,
    subject: "Dispute reported for session package",
    html: EMAIL_BASE_TEMPLATE(content, "warning"),
  };
}
