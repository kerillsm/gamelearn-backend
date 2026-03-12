import { SessionService } from "../../out/session.service";

export class GetNextSessionService {
  static async getNextSession(applicantId: string) {
    const session = await SessionService.getNextUpcomingForApplicant(
      applicantId,
    );

    if (!session) {
      return null;
    }

    const { sessionPackage, ...sessionData } = session;
    return {
      session: sessionData,
      sessionPackage,
    };
  }
}
