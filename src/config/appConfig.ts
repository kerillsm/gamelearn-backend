import { getSafeEnv } from "../lib/config/getSafeEnv";

export const appConfig = {
  appEnv: getSafeEnv("APP_ENV"),
  port: getSafeEnv("PORT"),
  frontendUrl: getSafeEnv("FRONTEND_URL"),
  auth: {
    jwtSecret: getSafeEnv("AUTH_JWT_SECRET"),
    refreshTokenSecret: getSafeEnv("AUTH_REFRESH_TOKEN_SECRET"),
    discordClientId: getSafeEnv("AUTH_DISCORD_CLIENT_ID"),
    discordClientSecret: getSafeEnv("AUTH_DISCORD_CLIENT_SECRET"),
    accessTokenDurationMinutes: 15,
    refreshTokenDurationMinutes: 60 * 24 * 7, // 7 days
  },
  s3: {
    bucketName: getSafeEnv("S3_BUCKET_NAME"),
    region: getSafeEnv("S3_REGION"),
    endpoint: getSafeEnv("S3_ENDPOINT"),
    accessKeyId: getSafeEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: getSafeEnv("S3_SECRET_ACCESS_KEY"),
    cdnUrl: getSafeEnv("S3_CDN_URL"),
    folderName: getSafeEnv("S3_FOLDER_NAME"),
  },
  stripe: {
    secretKey: getSafeEnv("STRIPE_SECRET_KEY"),
    webhookSecret: getSafeEnv("STRIPE_WEBHOOK_SECRET"),
  },
  sentry: {
    dsn: process.env.SENTRY_DSN ?? undefined,
  },
};
