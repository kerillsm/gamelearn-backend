import { getSafeEnv } from "../utils/getSafeEnv";

export const appConfig = {
  appEnv: getSafeEnv("APP_ENV"),
  port: getSafeEnv("PORT"),
  frontendUrl: getSafeEnv("FRONTEND_URL"),
};
