import { EmailStyle, EmailStyleConfig } from "./email.types";

const EMAIL_STYLES: Record<EmailStyle, EmailStyleConfig> = {
  default: {
    gradient: `
      background-color:#ffffff;
      background-image:
        radial-gradient(circle at 10% 10%, rgba(124,58,237,0.15), transparent 40%),
        radial-gradient(circle at 90% 0%, rgba(139,92,246,0.12), transparent 35%),
        linear-gradient(to right, rgba(124,58,237,0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(124,58,237,0.08) 1px, transparent 1px);
      background-size:
        auto,
        auto,
        14px 24px,
        14px 24px;
    `,
  },

  error: {
    gradient: `
      background-color:#fff5f5;
      background-image:
        radial-gradient(circle at 10% 10%, rgba(239,68,68,0.18), transparent 40%),
        radial-gradient(circle at 90% 0%, rgba(248,113,113,0.14), transparent 35%),
        linear-gradient(to right, rgba(239,68,68,0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(239,68,68,0.08) 1px, transparent 1px);
      background-size:
        auto,
        auto,
        14px 24px,
        14px 24px;
    `,
  },

  warning: {
    gradient: `
      background-color:#fff7ed;
      background-image:
        radial-gradient(circle at 10% 10%, rgba(245,158,11,0.18), transparent 40%),
        radial-gradient(circle at 90% 0%, rgba(251,191,36,0.14), transparent 35%),
        linear-gradient(to right, rgba(245,158,11,0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(245,158,11,0.08) 1px, transparent 1px);
      background-size:
        auto,
        auto,
        14px 24px,
        14px 24px;
    `,
  },
};

export const EMAIL_BASE_TEMPLATE = (
  content: string,
  style: EmailStyle = "default",
): string => {
  const { gradient } = EMAIL_STYLES[style];

  return `
<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="${gradient}; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <img src="https://gamelearn.fun/logo.svg" style="width: 160px; margin: 0 auto;"/>
      </div>
      
      ${content}
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} GameLearn. Всі права захищені.</p>
      </div>
    </div>
  </body>
</html>
`;
};
