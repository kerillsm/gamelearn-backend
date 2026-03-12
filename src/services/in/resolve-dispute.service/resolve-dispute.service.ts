import { SessionPackStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";

export class ResolveDisputeService {
  static async execute(sessionPackageId: string) {
    const sessionPackage =
      await SessionPackageService.getByIdWithSessions(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.status !== SessionPackStatus.IN_DISPUTE) {
      throw new HttpError(400, "Package must be in IN_DISPUTE status to resolve");
    }

    await SessionPackageService.update(sessionPackageId, {
      status: SessionPackStatus.COMPLETED,
    });

    return SessionPackageService.getByIdWithSessions(sessionPackageId);
  }
}
