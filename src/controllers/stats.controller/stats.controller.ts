import { UserRole } from "@prisma/client";
import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { GetStatsService } from "../../services/in/get-stats.service";

export class StatsController {
  @AuthRequired([UserRole.MENTOR, UserRole.ADMIN])
  static async getStats(ctx: Context) {
    const user = ctx.state.user!;
    const result = await GetStatsService.getStats(user.id, user.role);
    ctx.status = 200;
    ctx.body = result;
  }
}
