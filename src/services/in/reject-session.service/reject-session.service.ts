import { SessionStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";

export class RejectSessionService {
  static async execute(sessionId: string, mentorUserId: string, reason?: string) {
    const session = await SessionService.getById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (session.mentorUserId !== mentorUserId) {
      throw new HttpError(403, "Not authorized to reject this session");
    }

    if (session.status !== SessionStatus.PAYED) {
      throw new HttpError(400, "Session must be in PAYED status to reject");
    }

    return SessionService.updateSession(sessionId, {
      status: SessionStatus.REJECTED,
      rejectionReason: reason || null,
    });
  }
}
