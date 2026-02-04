import Router from "koa-router";
import passport from "koa-passport";
import { AuthController } from "../controllers/auth.controller";
import { Strategy as DiscordStrategy } from "passport-discord";
import { appConfig } from "../config/appConfig";

passport.use(
  new DiscordStrategy(
    {
      clientID: appConfig.auth.discordClientId,
      clientSecret: appConfig.auth.discordClientSecret,
      callbackURL: "/auth/discord/callback",
      scope: ["identify", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        if (!profile.email) {
          throw new Error("Email permission is required");
        }

        if (!profile.global_name) {
          throw new Error("Global name permission is required");
        }

        const user = await AuthController.getOrCreateUser({
          provider: "discord",
          providerAccountId: profile.id,
          userData: {
            email: profile.email,
            name: profile.global_name,
            picture: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
            discordUsername: profile.username,
          },
        });

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    },
  ),
);

const router = new Router();

router.get("/discord", (ctx, next) =>
  passport.authenticate("discord", {
    session: false,
    state: encodeURIComponent((ctx.query.state as string) || ""),
  })(ctx, next),
);

router.get(
  "/discord/callback",
  async (ctx, next) => {
    // Check if Discord returned an error (user cancelled)
    if (ctx.query.error) {
      ctx.redirect(`${appConfig.frontendUrl}/auth-error`);
      return;
    }
    await next();
  },
  passport.authenticate("discord", {
    session: false,
  }),
  AuthController.authorize,
);

router.post("/refresh", AuthController.refreshToken);

router.post("/logout", AuthController.logOut);

export { router as authRoutes };
