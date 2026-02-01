import { DateTime, Interval } from "luxon";
import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { UserService } from "../../out/user.service";
import { MentorAvailabilityService } from "../mentor-availability.service";
import { CreateSessionDTO } from "./create-session.dto";
import {
  SESSION_DURATION_BY_TYPE,
  SessionService,
} from "../../out/session.service";
import { SessionType } from "@prisma/client";
import { assertUnreachable } from "../../../lib/formatters/assertUnreachable";

const sessionsInPackCount = 3;
const sessionsPackDiscount = 0.1;
const serviceFeePercentage = 0.33;

export class CreateSessionService {
  static async create(data: CreateSessionDTO) {
    const user = await UserService.getById(data.userId);
    if (!user || !user.timezone) {
      throw new HttpError(400, "User not found or timezone not set");
    }

    const mentorProfile = await MentorProfileService.getBySlug(data.mentorSlug);
    if (!mentorProfile) {
      throw new HttpError(404, "Mentor profile not found");
    }

    const createdSessionsIds: string[] = [];
    try {
      const sessions = await Promise.all(
        data.sessions.map(async (session) => {
          const userDate = DateTime.fromFormat(session.date, "yyyy-MM-dd", {
            zone: user.timezone!,
          });
          if (!userDate.isValid) {
            throw new HttpError(400, "Invalid date format");
          }

          const intervals =
            await MentorAvailabilityService.getAvailableIntervals(
              user,
              mentorProfile.userId,
              userDate,
              data.sessionType,
            );

          const start = userDate.set({
            hour: Number(session.startTime.split(":")[0]),
            minute: Number(session.startTime.split(":")[1]),
            millisecond: 0,
            second: 0,
          });
          if (!start.isValid) {
            throw new HttpError(400, "Invalid start time format");
          }

          const userInterval = Interval.fromDateTimes(
            start,
            start.plus({ minutes: SESSION_DURATION_BY_TYPE[data.sessionType] }),
          );

          if (!userInterval.isValid) {
            throw new HttpError(400, "Invalid date or time");
          }

          if (!intervals.some((interval) => interval.engulfs(userInterval))) {
            throw new HttpError(400, "Selected time is not available");
          }

          // Can't take more then one vibe check
          if (data.sessionType === SessionType.VIBE_CHECK) {
            const existingVibeCheck = await SessionService.getVibeCheckSession(
              user.id,
              mentorProfile.userId,
            );
            if (existingVibeCheck) {
              throw new HttpError(
                400,
                "User has already taken a vibe check with this mentor",
              );
            }
          }

          let price: number | null = null;
          switch (data.sessionType) {
            case SessionType.VIBE_CHECK:
              price = 0;
              break;
            case SessionType.ONE_SESSION:
              price = mentorProfile.price;
              break;
            case SessionType.SESSIONS_PACK:
              price =
                mentorProfile.price *
                sessionsInPackCount *
                (1 - sessionsPackDiscount);
              break;
            default:
              assertUnreachable(data.sessionType);
              break;
          }

          if (price === null) {
            throw new HttpError(500, "Could not determine session price");
          }

          const serviceFee = serviceFeePercentage;

          const sessionCreated = await SessionService.createSession({
            duration: SESSION_DURATION_BY_TYPE[data.sessionType],
            price,
            scheduledAt: userInterval.start.toJSDate(),
            user: {
              connect: { id: user.id },
            },
            mentorUser: {
              connect: { id: mentorProfile.userId },
            },
            // Values between 0 and 1 representing percentage
            serviceFee,
            type: data.sessionType,
          });
          createdSessionsIds.push(sessionCreated.id);
          return sessionCreated;
        }),
      );
      return sessions;
    } catch (error) {
      createdSessionsIds.map(async (sessionId) => {
        await SessionService.deleteById(sessionId);
      });
      throw error;
    }
  }
}
