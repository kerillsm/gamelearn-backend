export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export type EmailStyle = "default" | "error" | "warning";

export interface EmailStyleConfig {
  gradient: string;
}
