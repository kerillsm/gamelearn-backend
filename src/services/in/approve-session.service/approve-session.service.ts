import { SessionStatus, StripeConnectStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";
import { UserService } from "../../out/user.service";

export class ApproveSessionService {
  static async execute(sessionId: string, mentorUserId: string, venue: string) {
    const session = await SessionService.getById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (session.mentorUserId !== mentorUserId) {
      throw new HttpError(403, "Not authorized to approve this session");
    }

    // Check mentor's Stripe Connect status
    const mentor = await UserService.getById(mentorUserId);
    if (mentor?.stripeConnectStatus !== StripeConnectStatus.ACTIVE) {
      throw new HttpError(400, "Set up your payout account to accept bookings");
    }

    if (session.status !== SessionStatus.PAYED) {
      throw new HttpError(400, "Session must be in PAYED status to approve");
    }

    if (!venue || venue.trim() === "") {
      throw new HttpError(400, "Venue is required to approve session");
    }

    return SessionService.updateSession(sessionId, {
      status: SessionStatus.APPROVED,
      venue: venue.trim(),
    });
  }
}
