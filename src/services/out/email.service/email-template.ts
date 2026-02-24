import { EmailStyle, EmailStyleConfig } from "./email.types";

const EMAIL_STYLES: Record<EmailStyle, EmailStyleConfig> = {
  default: {
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    headerBg: "#667eea",
  },
  error: {
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    headerBg: "#f5576c",
  },
  warning: {
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    headerBg: "#ff9966",
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
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: ${gradient}; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
      <span style="font-size: 32px; vertical-align: middle;">🎮</span>
      <span style="margin: 0; color: white; font-size: 24px; font-weight: 600; vertical-align: middle; margin-left: 10px;">GameLearn</span>
    </div>
    
    ${content}
    
    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
      <p>© ${new Date().getFullYear()} GameLearn. Всі права захищені.</p>
    </div>
  </body>
</html>
`;
};
