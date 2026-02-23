import { SessionPackStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";

export class CancelPendingSessionPackageService {
  static async execute(sessionPackageId: string, applicantId: string) {
    const sessionPackage = await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.applicantId !== applicantId) {
      throw new HttpError(403, "Not authorized to cancel this package");
    }

    if (sessionPackage.status !== SessionPackStatus.PENDING) {
      throw new HttpError(400, "Only PENDING packages can be canceled");
    }

    await SessionPackageService.deleteById(sessionPackageId);
    return { deleted: true };
  }
}
