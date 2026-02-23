import { SessionStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";

export class CancelSessionService {
  static async execute(
    sessionId: string,
    userId: string,
    isMentor: boolean,
    reason?: string,
  ) {
    const session = await SessionService.getByIdWithPackage(sessionId);

    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (isMentor && session.sessionPackage.mentorId !== userId) {
      throw new HttpError(403, "You can only cancel your own sessions");
    }
    if (!isMentor && session.sessionPackage.applicantId !== userId) {
      throw new HttpError(403, "You can only cancel your own sessions");
    }

    if (
      session.status !== SessionStatus.PAYED &&
      session.status !== SessionStatus.APPROVED
    ) {
      throw new HttpError(
        400,
        "Only paid or approved sessions can be canceled",
      );
    }

    const updatedSession = await SessionService.updateSession(sessionId, {
      status: SessionStatus.CANCELED,
    });

    return {
      session: updatedSession,
      refund: null,
    };
  }
}
