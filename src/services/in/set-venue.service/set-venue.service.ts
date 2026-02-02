import { SessionStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";

export class SetVenueService {
  static async execute(sessionId: string, mentorUserId: string, venue: string) {
    const session = await SessionService.getById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (session.mentorUserId !== mentorUserId) {
      throw new HttpError(403, "Not authorized to update this session");
    }

    if (session.status !== SessionStatus.APPROVED) {
      throw new HttpError(400, "Session must be approved to set venue");
    }

    return SessionService.updateSession(sessionId, {
      venue: venue.trim(),
    });
  }
}
