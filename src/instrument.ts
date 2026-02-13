import * as Sentry from "@sentry/node";
import { appConfig } from "./config/appConfig";

if (appConfig.sentry.dsn) {
  Sentry.init({
    dsn: appConfig.sentry.dsn,
    environment: appConfig.appEnv,
    tracesSampleRate: 1.0,
  });
}
