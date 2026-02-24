import { Session, SessionPackage, User } from "@prisma/client";
import { EmailTemplate } from "../email.types";
import { EMAIL_BASE_TEMPLATE } from "../email-template";

export function buildApplicantCanceledSessionPackageEmail(data: {
  applicant: User;
  mentor: User;
  sessions: Session[];
  sessionPackage: SessionPackage;
  refundAmount: number;
  reason?: string;
}): { toApplicant: EmailTemplate; toMentor: EmailTemplate } {
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

  const hasRefund = data.refundAmount > 0;
  const refundText = hasRefund
    ? `$${data.refundAmount.toFixed(2)}`
    : "без повернення коштів";

  // Email to applicant
  const applicantContent = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #ff9800; text-align: center; font-size: 24px;">🚫 Бронювання скасовано</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.applicant.name}</strong>,</p>
        
        <p>Ви успішно скасували своє бронювання з ментором <strong>${data.mentor.name}</strong>.</p>
        
        ${
          data.reason
            ? `
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💬 Причина скасування:</strong><br/>
            ${data.reason}
          </p>
        </div>
        `
            : ""
        }

        <h3 style="color: #667eea;">📅 Скасовані сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        ${
          hasRefund
            ? `
        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💰 Повернення коштів</strong><br/>
            Ми автоматично ініціювали повернення <strong>${refundText}</strong> на ваш платіжний рахунок. Зазвичай кошти надходять протягом 5-10 робочих днів.
          </p>
        </div>
        `
            : `
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>⚠️ Повернення коштів недоступне</strong><br/>
            На жаль, згідно з нашими правилами, повернення коштів неможливе через те, що у вас вже була завершена сесія або найближча сесія розпочнеться менше ніж через годину.
          </p>
        </div>
        `
        }

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>🔍 Що далі:</strong><br/>
            • Ви можете забронювати сесію з іншим ментором<br/>
            • Або спробувати забронювати інший час з цим же ментором<br/>
            • Перегляньте наш каталог доступних менторів
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Якщо у вас виникли питання щодо скасування, будь ласка, зв'яжіться з нами.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  // Email to mentor
  const mentorContent = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #ff9800; text-align: center; font-size: 24px;">🚫 Учень скасував бронювання</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.mentor.name}</strong>,</p>
        
        <p>На жаль, учень <strong>${data.applicant.name}</strong> скасував своє бронювання.</p>
        
        ${
          data.reason
            ? `
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💬 Причина скасування:</strong><br/>
            ${data.reason}
          </p>
        </div>
        `
            : ""
        }

        <h3 style="color: #667eea;">📅 Скасовані сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>📌 Зауважте:</strong><br/>
            Ці часові слоти тепер знову доступні для бронювання іншими учнями.
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Дякуємо за розуміння. Сподіваємось на нові бронювання!
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    toApplicant: {
      to: data.applicant.email,
      subject: "Бронювання скасовано",
      html: EMAIL_BASE_TEMPLATE(applicantContent),
    },
    toMentor: {
      to: data.mentor.email,
      subject: "Учень скасував бронювання",
      html: EMAIL_BASE_TEMPLATE(mentorContent),
    },
  };
}

export function buildMentorCanceledSessionPackageEmail(data: {
  applicant: User;
  mentor: User;
  sessions: Session[];
  sessionPackage: SessionPackage;
  reason?: string;
}): { toApplicant: EmailTemplate; toMentor: EmailTemplate } {
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

  // Email to applicant
  const applicantContent = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #f44336; text-align: center; font-size: 24px;">❌ Ментор скасував бронювання</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.applicant.name}</strong>,</p>
        
        <p>На жаль, ментор <strong>${data.mentor.name}</strong> змушений був скасувати ваше бронювання.</p>
        
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

        <h3 style="color: #667eea;">📅 Скасовані сесії:</h3>
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
          Перепрошуємо за незручності. Якщо у вас виникли питання, будь ласка, зв'яжіться з нами.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  // Email to mentor
  const mentorContent = `
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; margin-top: -10px;">
        <h2 style="margin-top: 0; color: #ff9800; text-align: center; font-size: 24px;">✅ Бронювання скасовано</h2>
        
        <p style="font-size: 18px; margin-top: 20px;">Вітаємо, <strong>${data.mentor.name}</strong>,</p>
        
        <p>Ви успішно скасували бронювання з учнем <strong>${data.applicant.name}</strong>.</p>
        
        ${
          data.reason
            ? `
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💬 Причина скасування:</strong><br/>
            ${data.reason}
          </p>
        </div>
        `
            : ""
        }

        <h3 style="color: #667eea;">📅 Скасовані сесії:</h3>
        <ul style="list-style: none; padding: 0;">
          ${sessionsHtml}
        </ul>

        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💰 Повернення коштів</strong><br/>
            Учню було повернуто <strong>${totalPrice}</strong>. Ви не отримаєте оплату за цю сесію.
          </p>
        </div>

        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>📌 Зауважте:</strong><br/>
            Ці часові слоти тепер знову доступні для бронювання іншими учнями.
          </p>
        </div>

        <p style="margin-top: 30px; color: #666;">
          Дякуємо за відповідальне ставлення до координації розкладу.
        </p>

        <p style="margin-top: 20px;">
          З повагою,<br/>
          <strong>Команда GameLearn</strong> 🎮
        </p>
      </div>
    `;

  return {
    toApplicant: {
      to: data.applicant.email,
      subject: "Бронювання скасовано - кошти повернуто",
      html: EMAIL_BASE_TEMPLATE(applicantContent),
    },
    toMentor: {
      to: data.mentor.email,
      subject: "Бронювання скасовано",
      html: EMAIL_BASE_TEMPLATE(mentorContent),
    },
  };
}
