import { UserRole } from "@prisma/client";
import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { GetIncomesHistoryService } from "../../services/in/get-incomes-history.service";
import { GetPaymentHistoryService } from "../../services/in/get-payment-history.service";
import { GetUserBalanceService } from "../../services/in/get-user-balance.service";

export class FinanceController {
  @AuthRequired()
  static async getBalance(ctx: Context) {
    const user = ctx.state.user!;
    const result = await GetUserBalanceService.execute(user.id);
    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getPaymentHistory(ctx: Context) {
    const user = ctx.state.user!;
    const page = ctx.request.query.page
      ? parseInt(ctx.request.query.page as string, 10)
      : 1;
    const pageSize = ctx.request.query.pageSize
      ? parseInt(ctx.request.query.pageSize as string, 10)
      : 10;
    const result = await GetPaymentHistoryService.execute(
      user.id,
      page,
      pageSize,
    );
    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getIncomesHistory(ctx: Context) {
    const user = ctx.state.user!;
    const page = ctx.request.query.page
      ? parseInt(ctx.request.query.page as string, 10)
      : 1;
    const pageSize = ctx.request.query.pageSize
      ? parseInt(ctx.request.query.pageSize as string, 10)
      : 10;
    const includePlatformIncomes = user.role === UserRole.ADMIN;
    const result = await GetIncomesHistoryService.execute(
      user.id,
      page,
      pageSize,
      includePlatformIncomes,
    );
    ctx.status = 200;
    ctx.body = result;
  }
}
