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
};
