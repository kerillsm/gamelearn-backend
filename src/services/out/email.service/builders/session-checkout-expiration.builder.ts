import { Session, SessionPackage, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildApplicantSessionCheckoutExpiredEmail(data: {
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
        <h2 style="margin-top: 0; color: #ff9800; text-align: center; font-size: 24px;">⏰ Термін оплати сплив</h2>

        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.applicant.name}</strong>! 👋</p>

        <p>Не хвилюйтеся — ми скасували неоплачене бронювання з ментором <strong>${data.mentor.name}</strong>, оскільки час на оплату закінчився.</p>

        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>📌 Деталі скасованого бронювання</strong><br/>
            Тип пакету: <strong>${data.sessionPackage.type}</strong><br/>
            Загальна вартість: <strong>${totalPrice}</strong>
          </p>
        </div>

        <h3 style="color: #667eea;">📅 Сесії, які були в бронюванні:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>🔁 Що далі:</strong><br/>
            Ви можете повторно забронювати ці або інші сесії в будь-який зручний час.
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Якщо виникли питання, будь ласка, зверніться до нашої підтримки.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    to: data.applicant.email,
    subject: "Термін оплати бронювання сплив",
    html: EMAIL_BASE_TEMPLATE(content, "warning"),
  };
}
