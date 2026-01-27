import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { HttpError } from "../../lib/formatters/httpError";
import { UserService } from "../../services/out/user.service";
import { Validate } from "../../lib/decorators/validate.decorator";
import Joi from "joi";
import { UpdateUserService } from "../../services/in/update-user.service";

export class UserController {
  @AuthRequired()
  static async getCurrentUser(ctx: Context) {
    const user = ctx.state.user!;

    const userDetails = await UserService.getByEmail(user.email);
    if (!userDetails) {
      throw new HttpError(404, "User not found");
    }

    ctx.status = 200;
    ctx.body = { user: userDetails };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      name: Joi.string().optional(),
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
        picture?: string;
        timezone?: string;
      },
    );

    ctx.status = 200;
    ctx.body = { user: updatedUser };
  }
}
