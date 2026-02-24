import { Session, SessionPackage, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildSessionPackageRejectionEmail(data: {
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
        <h2 style="margin-top: 0; color: #f44336; text-align: center; font-size: 24px;">❌ Бронювання відхилено</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.applicant.name}</strong>,</p>
        
        <p>На жаль, ментор <strong>${data.mentor.name}</strong> не зміг підтвердити ваше бронювання.</p>
        
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
            Ми автоматично ініціювали повернення <strong>${totalPrice}</strong> на ваш платіжний рахунок. Зазвичай кошти надходять протягом 5-10 робочих днів.
          </p>
        </div>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>🔍 Що далі:</strong><br/>
            • Ви можете забронювати сесію з іншим ментором<br/>
            • Або спробувати забронювати інший час з цим же ментором<br/>
            • Перегляньте наш каталог доступних менторів
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Сподіваємось, що ви знайдете іншого ментора, який підійде вам краще. Якщо у вас виникли питання, будь ласка, зв'яжіться з нами.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    to: data.applicant.email,
    subject: "Бронювання відхилено - кошти повернуто",
    html: EMAIL_BASE_TEMPLATE(content),
  };
}
