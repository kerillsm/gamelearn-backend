import { Session, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildSessionPackageCompletedEmail(data: {
  applicant: User;
  mentor: User;
  sessions: Session[];
  rateUrl: string;
  reportEmail: string;
}): EmailTemplate {
  const sessionsHtml = data.sessions
    .map((session) => {
      const formattedDate = new Intl.DateTimeFormat("uk-UA", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(session.scheduledAt);

      return `
          <li style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
            <strong>📅 ${formattedDate}</strong><br/>
            ⏱️ Тривалість: ${session.duration} хв
          </li>
        `;
    })
    .join("");

  const content = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #4caf50; text-align: center; font-size: 24px;">✅ Усі сесії завершено</h2>

        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.applicant.name}</strong>! 🎉</p>

        <p>Усі сесії з ментором <strong>${data.mentor.name}</strong> у цьому пакеті завершені.</p>

        <h3 style="color: #667eea;">📅 Завершені сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="text-align: center; margin: 28px 0;">
          <a
            href="${data.rateUrl}"
            style="display: inline-block; background: #667eea; color: white; text-decoration: none; font-weight: 600; padding: 12px 20px; border-radius: 8px;"
          >
            ⭐ Оцінити ментора
          </a>
        </div>

        <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
          Якщо у вас виникли проблеми, будь ласка, повідомте нам:
          <a href="mailto:${data.reportEmail}" style="color: #667eea;">${data.reportEmail}</a>
        </p>

        <p style="margin-top: 24px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    to: data.applicant.email,
    subject: "Усі ваші сесії завершено — залиште відгук",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
