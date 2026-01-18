import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { HttpError } from "../../lib/formatters/httpError";
import { UserService } from "../../services/out/user.service";

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
}
