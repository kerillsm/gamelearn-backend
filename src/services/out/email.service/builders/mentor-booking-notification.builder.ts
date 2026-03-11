import { Session, SessionPackage, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildMentorBookingNotificationEmail(data: {
  applicant: User;
  mentor: User;
  sessions: Session[];
  sessionPackage: SessionPackage;
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

  const totalPrice = `$${data.sessionPackage.price.toFixed(2)}`;

  const content = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #667eea; text-align: center; font-size: 24px;">📩 Новий учень забронював сесії з вами</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.mentor.name}</strong>! 👋</p>
        
        <p>Учень <strong>${data.applicant.name}</strong> забронював сесії з вами. Нижче деталі бронювання.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #667eea;">📋 Деталі бронювання</h2>
          <p><strong>Тип пакету:</strong> ${data.sessionPackage.type}</p>
          <p><strong>Загальна вартість:</strong> ${totalPrice}</p>
        </div>

        <h3 style="color: #667eea;">📅 Заброньовані сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>📌 Що далі:</strong><br/>
            Підтвердіть або відхиліть бронювання у своєму кабінеті ментора, щоб учень отримав повідомлення.
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Якщо у вас виникли питання, будь ласка, зв'яжіться з нами.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    to: data.mentor.email,
    subject: "Новий учень забронював сесії з вами — підтвердіть бронювання",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
