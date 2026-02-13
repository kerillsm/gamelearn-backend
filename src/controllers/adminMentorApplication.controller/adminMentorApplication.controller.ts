import Joi from "joi";
import { Context } from "koa";
import { MentorApplicationStatus } from "@prisma/client";
import { ListMentorApplicationsService } from "../../services/in/list-mentor-applications.service";
import { ApproveMentorApplicationService } from "../../services/in/approve-mentor-application.service";
import { RejectMentorApplicationService } from "../../services/in/reject-mentor-application.service";
import { Validate } from "../../lib/decorators/validate.decorator";
import { HttpError } from "../../lib/formatters/httpError";

export class AdminMentorApplicationController {
  static async list(ctx: Context) {
    const page = ctx.request.query.page
      ? parseInt(ctx.request.query.page as string, 10)
      : undefined;
    const take = ctx.request.query.take
      ? parseInt(ctx.request.query.take as string, 10)
      : undefined;
    const statusParam = ctx.request.query.status as string | undefined;
    const status =
      statusParam && Object.values(MentorApplicationStatus).includes(statusParam as MentorApplicationStatus)
        ? (statusParam as MentorApplicationStatus)
        : undefined;

    const { applications, totalCount } =
      await ListMentorApplicationsService.execute({ page, take, status });
    ctx.status = 200;
    ctx.body = { applications, totalCount };
  }

  @Validate(Joi.object({ slug: Joi.string().required().min(1) }))
  static async approve(ctx: Context) {
    const id = ctx.params.id;
    if (!id) {
      throw new HttpError(400, "Application id is required");
    }
    const body = ctx.request.body as { slug: string };
    const application = await ApproveMentorApplicationService.execute(
      id,
      body.slug.trim(),
    );
    ctx.status = 200;
    ctx.body = { application };
  }

  @Validate(Joi.object({ rejectionReason: Joi.string().required() }))
  static async reject(ctx: Context) {
    const id = ctx.params.id;
    if (!id) {
      throw new HttpError(400, "Application id is required");
    }
    const body = ctx.request.body as { rejectionReason: string };
    const application = await RejectMentorApplicationService.execute(
      id,
      body.rejectionReason,
    );
    ctx.status = 200;
    ctx.body = { application };
  }
}
