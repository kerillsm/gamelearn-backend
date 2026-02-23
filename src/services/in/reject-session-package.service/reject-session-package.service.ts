import { SessionPackStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";

export class RejectSessionPackageService {
  static async execute(
    sessionPackageId: string,
    mentorUserId: string,
    reason?: string,
  ) {
    const sessionPackage = await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.mentorId !== mentorUserId) {
      throw new HttpError(403, "Not authorized to reject this package");
    }

    if (sessionPackage.status !== SessionPackStatus.PAYED) {
      throw new HttpError(400, "Package must be in PAYED status to reject");
    }

    await SessionPackageService.update(sessionPackageId, {
      status: SessionPackStatus.REJECTED,
      rejectionReason: reason?.trim() || null,
    });

    for (const session of sessionPackage.sessions) {
      await SessionService.updateSession(session.id, { status: "REJECTED" });
    }

    return SessionPackageService.getByIdWithSessions(sessionPackageId);
  }
}
