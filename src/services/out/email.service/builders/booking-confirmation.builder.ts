import { Session, SessionPackage, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildApplicantBookingConfirmationEmail(data: {
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
        <h2 style="margin-top: 0; color: #667eea; text-align: center; font-size: 24px;">✨ Оплата успішно виконана!</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.applicant.name}</strong>! 👋</p>
        
        <p>Ваше бронювання сесій з ментором <strong>${data.mentor.name}</strong> успішно підтверджено!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #667eea;">📋 Деталі бронювання</h2>
          <p><strong>Тип пакету:</strong> ${data.sessionPackage.type}</p>
          <p><strong>Загальна вартість:</strong> ${totalPrice}</p>
        </div>

        <h3 style="color: #667eea;">📅 Заброньовані сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>⏳ Очікуйте підтвердження</strong><br/>
            Ментор <strong>${data.mentor.name}</strong> має підтвердити майбутню зустріч. Ви отримаєте додаткове повідомлення, як тільки ментор підтвердить сесії.
          </p>
        </div>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💡 Підказка:</strong><br/>
            Підготуйте питання та теми, які ви хочете обговорити під час сесій, щоб отримати максимальну користь від занять.
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
    to: data.applicant.email,
    subject: "Бронювання підтверджено! Очікуйте підтвердження від ментора",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
