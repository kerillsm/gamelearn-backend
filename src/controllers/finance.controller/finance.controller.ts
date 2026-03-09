import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { GetUserBalanceService } from "../../services/in/get-user-balance.service";

export class FinanceController {
  @AuthRequired()
  static async getBalance(ctx: Context) {
    const user = ctx.state.user!;
    const result = await GetUserBalanceService.execute(user.id);
    ctx.status = 200;
    ctx.body = result;
  }
}
