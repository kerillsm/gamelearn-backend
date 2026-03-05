import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import Joi from "joi";
import { CreateMentorApplicationService } from "../../services/in/create-mentor-application.service";
import { MentorGame, UserRole } from "@prisma/client";

export class MentorApplicationController {
  @AuthRequired([UserRole.USER])
  @Validate(
    Joi.object({
      name: Joi.string().required(),
      game: Joi.string()
        .valid(...Object.values(MentorGame))
        .required(),
      rating: Joi.number().min(0).required(),
      experiencePlaying: Joi.string().required(),
      experienceTeaching: Joi.string().optional(),
      socialMedia: Joi.string().optional(),
      aboutYourself: Joi.string().optional(),
      contactInfo: Joi.string().required(),
      steamProfile: Joi.string().required(),
    }),
  )
  static async createApplication(ctx: Context) {
    const dto = ctx.request.body as {
      name: string;
      game: MentorGame;
      rating: number;
      experiencePlaying: string;
      experienceTeaching?: string;
      socialMedia?: string;
      aboutYourself?: string;
      contactInfo: string;
      steamProfile: string;
    };
    const userId = ctx.state.user.id!;

    const application = await CreateMentorApplicationService.createApplication(
      userId,
      dto,
    );

    ctx.status = 201;
    ctx.body = { application };
  }
}
