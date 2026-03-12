import { UserRole } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";
import { UserService } from "../../out/user.service";
import { AdminStats, MentorStats } from "./get-stats.inteface";
import { DateTime } from "luxon";

export class GetStatsService {
  static async getStats(
    userId: string,
    userRole: UserRole,
  ): Promise<MentorStats | AdminStats> {
    if (userRole !== UserRole.MENTOR && userRole !== UserRole.ADMIN) {
      throw new HttpError(
        403,
        "Forbidden: stats are only available for mentor or admin",
      );
    }

    const user = await UserService.getById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const startOfWeek = DateTime.now().startOf("week").toJSDate();

    if (userRole === UserRole.MENTOR) {
      const [totalSessionsCompleted, sessionsSinceStartWeek] =
        await Promise.all([
          SessionService.countCompletedSessionsByMentor(userId),
          SessionService.countCompletedSessionsByMentorSince(
            userId,
            startOfWeek,
          ),
        ]);
      return { totalSessionsCompleted, sessionsSinceStartWeek };
    }

    const [
      totalUsers,
      totalMentors,
      totalSessionsCompleted,
      newUsersSinceStartWeek,
    ] = await Promise.all([
      UserService.countUsers(),
      UserService.countUsers(UserRole.MENTOR),
      SessionService.countCompletedSessions(),
      UserService.countUsersCreatedSince(startOfWeek),
    ]);
    return {
      totalUsers,
      totalMentors,
      totalSessionsCompleted,
      newUsersSinceStartWeek,
    };
  }
}
