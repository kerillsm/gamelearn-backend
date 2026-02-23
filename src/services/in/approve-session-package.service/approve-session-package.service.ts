import { SessionPackStatus, StripeConnectStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { UserService } from "../../out/user.service";

export class ApproveSessionPackageService {
  static async execute(
    sessionPackageId: string,
    mentorUserId: string,
    venue: string,
  ) {
    const sessionPackage = await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.mentorId !== mentorUserId) {
      throw new HttpError(403, "Not authorized to approve this package");
    }

    const mentor = await UserService.getById(mentorUserId);
    if (mentor?.stripeConnectStatus !== StripeConnectStatus.ACTIVE) {
      throw new HttpError(400, "Set up your payout account to accept bookings");
    }

    if (sessionPackage.status !== SessionPackStatus.PAYED) {
      throw new HttpError(400, "Package must be in PAYED status to approve");
    }

    if (!venue || venue.trim() === "") {
      throw new HttpError(400, "Venue is required to approve");
    }

    await SessionPackageService.update(sessionPackageId, {
      status: SessionPackStatus.APPROVED,
      venue: venue.trim(),
    });

    for (const session of sessionPackage.sessions) {
      await SessionService.updateSession(session.id, { status: "APPROVED" });
    }

    return SessionPackageService.getByIdWithSessions(sessionPackageId);
  }
}
