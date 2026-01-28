import Joi from "joi";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import { Context } from "koa";
import {
  UpdateAvailabilityRulesDto,
  UpdateAvailabilityRulesService,
} from "../../services/in/update-availability-rules.service";
import { GetAvailabilityRulesService } from "../../services/in/get-availability-rules.service";
import { AddAvailabilityExceptionService } from "../../services/in/add-availability-exception.service";
import { GetAvailabilityExceptionsService } from "../../services/in/get-availability-exceptions.service";
import { AvailabilityService } from "../../services/out/availability.service/availability.service";
import { MentorAvailabilityService } from "../../services/in/mentor-availability.service";
import { SessionType } from "@prisma/client";
import { HttpError } from "../../lib/formatters/httpError";

export class AvailabilityController {
  @AuthRequired()
  @Validate(
    Joi.object({
      rules: Joi.array().items(
        Joi.object({
          day: Joi.string()
            .valid("MO", "TU", "WE", "TH", "FR", "SA", "SU")
            .required(),
          slots: Joi.array()
            .items(
              Joi.object({
                startTime: Joi.string()
                  .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                  .required(),
                endTime: Joi.string()
                  .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                  .required(),
              }),
            )
            .required(),
        }),
      ),
    }),
  )
  static async updateAvailabilityRules(ctx: Context) {
    const userId = ctx.state.user.id;
    const { rules } = ctx.request.body as { rules: UpdateAvailabilityRulesDto };
    await UpdateAvailabilityRulesService.updateAvailabilityRules(userId, rules);
    ctx.status = 200;
    ctx.body = { message: "Availability rules updated successfully" };
  }

  @AuthRequired()
  static async getAvailabilityRules(ctx: Context) {
    const userId = ctx.state.user.id;
    const rules =
      await GetAvailabilityRulesService.getAvailabilityRules(userId);
    ctx.status = 200;
    ctx.body = { rules };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      exception: Joi.object({
        date: Joi.string().isoDate().required(),
        startTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),
        endTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),
        type: Joi.string().valid("UNAVAILABLE", "AVAILABLE").required(),
      }).required(),
    }).required(),
  )
  static async addAvailabilityException(ctx: Context) {
    const userId = ctx.state.user.id;
    const { exception } = ctx.request.body as {
      exception: {
        date: string;
        startTime: string;
        endTime: string;
        type: "UNAVAILABLE" | "AVAILABLE";
      };
    };
    await AddAvailabilityExceptionService.addAvailabilityException(
      userId,
      exception,
    );
    ctx.status = 200;
    ctx.body = { message: "Availability exception added successfully" };
  }

  @AuthRequired()
  static async getAvailabilityExceptions(ctx: Context) {
    const userId = ctx.state.user.id;
    const exceptions =
      await GetAvailabilityExceptionsService.getAvailabilityExceptions(userId);

    ctx.status = 200;
    ctx.body = { exceptions };
  }

  @AuthRequired()
  static async removeAvailabilityException(ctx: Context) {
    const userId = ctx.state.user.id;
    const { exceptionId } = ctx.params as { exceptionId?: string };

    if (!exceptionId) {
      ctx.status = 400;
      ctx.body = { message: "Exception ID is required" };
      return;
    }

    await AvailabilityService.deleteAvailabilityException(exceptionId, userId);

    ctx.status = 200;
    ctx.body = { message: "Availability exception removed successfully" };
  }

  @AuthRequired()
  static async getMentorAvailableDates(ctx: Context) {
    const userId = ctx.state.user.id;
    const mentorUserId = ctx.params.mentorId;
    const { year, month, sessionType } = ctx.query as {
      year: string;
      month: string;
      sessionType: string;
    };

    if (
      !mentorUserId ||
      !year ||
      !month ||
      !sessionType ||
      Object.keys(SessionType).indexOf(sessionType) === -1
    ) {
      throw new HttpError(
        400,
        "mentorUserId, date and sessionType are required",
      );
    }

    const availableDates =
      await MentorAvailabilityService.getAvailableMentorDates({
        userId,
        mentorUserId,
        sessionType: sessionType as SessionType,
        year: parseInt(year, 10),
        month: parseInt(month, 10),
      });

    ctx.status = 200;
    ctx.body = { availableDates };
  }

  @AuthRequired()
  static async getMentorAvailableTimes(ctx: Context) {
    const userId = ctx.state.user.id;
    const mentorUserId = ctx.params.mentorId;
    const { date, sessionType } = ctx.query as {
      date: string;
      sessionType: string;
    };

    if (
      !mentorUserId ||
      !date ||
      !sessionType ||
      Object.keys(SessionType).indexOf(sessionType) === -1
    ) {
      throw new HttpError(
        400,
        "mentorUserId, date and sessionType are required",
      );
    }

    const availableTimes =
      await MentorAvailabilityService.getMentorAvailableTimes(
        userId,
        mentorUserId,
        date,
        sessionType as SessionType,
      );

    ctx.status = 200;
    ctx.body = { availableTimes };
  }
}
