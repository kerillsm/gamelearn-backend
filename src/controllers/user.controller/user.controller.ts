import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { HttpError } from "../../lib/formatters/httpError";
import { UserService } from "../../services/out/user.service";
import { Validate } from "../../lib/decorators/validate.decorator";
import Joi from "joi";
import { UpdateUserService } from "../../services/in/update-user.service";
import { AcceptTermsService } from "../../services/in/accept-terms.service";

export class UserController {
  @AuthRequired()
  static async getCurrentUser(ctx: Context) {
    const user = ctx.state.user!;

    const userDetails = await UserService.getByEmail(user.email);
    if (!userDetails) {
      throw new HttpError(404, "User not found");
    }
    const { emailVerificationToken: _token, ...userForClient } = userDetails;
    ctx.status = 200;
    ctx.body = { user: userForClient };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      picture: Joi.string().uri().optional(),
      timezone: Joi.string().optional(),
    }),
  )
  static async updateCurrentUser(ctx: Context) {
    const user = ctx.state.user!;

    const updatedUser = await UpdateUserService.updateUser(
      user.id,
      ctx.request.body as {
        name?: string;
        email?: string;
        picture?: string;
        timezone?: string;
      },
    );
    const { emailVerificationToken: _t, ...userForClient } = updatedUser;
    ctx.status = 200;
    ctx.body = { user: userForClient };
  }

  @AuthRequired()
  static async acceptTerms(ctx: Context) {
    const user = ctx.state.user!;
    const ipAddress = ctx.ip || ctx.request.ip || "unknown";
    const userAgent = ctx.get("User-Agent") || undefined;

    const result = await AcceptTermsService.execute({
      userId: user.id,
      ipAddress,
      userAgent,
    });

    ctx.status = 200;
    ctx.body = { termsAcceptedAt: result.termsAcceptedAt };
  }
}
