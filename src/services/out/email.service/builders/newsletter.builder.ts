import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildNewsletterEmail(data: {
  to: string;
  htmlContent: string;
  unsubscribeLink: string;
}): EmailTemplate {
  const content = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        ${data.htmlContent}

        <p style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          GameLearn Team
        </p>

         <p style="margin-top: 20px; font-size: 12px; text-align: center; color: #ccc;">
          If you no longer wish to receive these emails, you can
          <a href="${data.unsubscribeLink}" style="color: #ccc;">unsubscribe here</a>.
        </p>
      </div>
    `;

  return {
    to: data.to,
    subject: "Newsletter – GameLearn",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
