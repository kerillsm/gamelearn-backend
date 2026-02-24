import { Session, SessionPackage, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildSessionPackageApprovalEmail(data: {
  applicant: User;
  mentor: User;
  sessions: Session[];
  sessionPackage: SessionPackage;
  venue: string;
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
        <h2 style="margin-top: 0; color: #4caf50; text-align: center; font-size: 24px;">✅ Сесії підтверджено!</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.applicant.name}</strong>! 🎉</p>
        
        <p>Ментор <strong>${data.mentor.name}</strong> підтвердив ваше бронювання! Ваші сесії готові до проведення.</p>
        
        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>📍 Місце проведення:</strong><br/>
            ${data.venue}
          </p>
        </div>

        <h3 style="color: #667eea;">📅 Підтверджені сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💡 Що далі:</strong><br/>
            • Підготуйте питання та теми для обговорення<br/>
            • Переконайтесь, що у вас є доступ до вказаного місця проведення<br/>
            • За 15 хвилин до сесії будьте готові розпочати
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Бажаємо вам продуктивних і цікавих сесій! Якщо виникнуть питання, зв'яжіться з нами.
        </p>

        <p style="margin-top: 10px; color: #999; font-size: 12px;">
          У разі потреби ви можете скасувати або перенести сесію через свій персональний кабінет.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    to: data.applicant.email,
    subject: "Ваші сесії підтверджено! Готуйтесь до навчання",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
