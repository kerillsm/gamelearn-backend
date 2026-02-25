import { Session, SessionPackage, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildSessionPackageAutoRejectionMentorEmail(data: {
  applicant: User;
  mentor: User;
  sessions: Session[];
  sessionPackage: SessionPackage;
  reason?: string;
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
        <h2 style="margin-top: 0; color: #f44336; text-align: center; font-size: 24px;">⏰ Автоматичне відхилення бронювання</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.mentor.name}</strong>,</p>
        
        <p>Бронювання від <strong>${data.applicant.name}</strong> було автоматично відхилено системою, оскільки час першої сесії наближався, а ви не підтвердили або відхилили запит.</p>

        ${
          data.reason
            ? `
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💬 Причина:</strong><br/>
            ${data.reason}
          </p>
        </div>
        `
            : ""
        }

        <h3 style="color: #667eea;">📅 Відхилені сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💰 Повернення коштів</strong><br/>
            Учню автоматично повернуто <strong>${totalPrice}</strong>. Ви не отримаєте оплату за це бронювання.
          </p>
        </div>

        <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>⚠️ Важливо:</strong><br/>
            • Своєчасно переглядайте та підтверджуйте бронювання<br/>
            • Для запобігання автоматичних відхилень, обробляйте запити протягом доби<br/>
            • Якщо ви не можете взяти сесію, краще відхилити запит вручну з поясненням
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Будь ласка, стежте за новими бронюваннями в особистому кабінеті, щоб уникнути таких ситуацій у майбутньому.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    to: data.mentor.email,
    subject: "Бронювання автоматично відхилено через відсутність підтвердження",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
