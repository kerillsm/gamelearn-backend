import { Resend } from "resend";
import { appConfig } from "../../../config/appConfig";
import { EmailTemplate } from "./email.types";

const resend = appConfig.resend.apiKey
  ? new Resend(appConfig.resend.apiKey)
  : null;

export class EmailService {
  static async sendEmail(emailTemplate: EmailTemplate): Promise<void> {
    if (!resend) {
      console.warn("Resend is not configured, skipping email");
      return;
    }

    try {
      const response = await resend.emails.send({
        from: appConfig.resend.fromEmail,
        to: [emailTemplate.to],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      console.log(`Email sent to ${emailTemplate.to}:`, response);
    } catch (error) {
      console.error(`Failed to send email to ${emailTemplate.to}:`, error);
      throw error;
    }
  }
}
