import { SessionPackStatus } from "@prisma/client";
import { SessionPackageService } from "../../out/sessionPackage.service";

const PAGE_SIZE = 10;

export class ListSessionPackagesService {
  static async listUserSessionPackages(
    applicantId: string,
    page = 1,
    status?: string,
  ) {
    const result = await SessionPackageService.listPackages(
      { applicantId },
      { page, pageSize: PAGE_SIZE, status: this.parseStatus(status) },
    );
    return { ...result, page, pageSize: PAGE_SIZE };
  }

  static async listMentorSessionPackages(
    mentorId: string,
    page = 1,
    status?: string,
  ) {
    const result = await SessionPackageService.listPackages(
      { mentorId },
      { page, pageSize: PAGE_SIZE, status: this.parseStatus(status) },
    );
    return { ...result, page, pageSize: PAGE_SIZE };
  }

  private static parseStatus(status?: string): SessionPackStatus | undefined {
    if (!status || status === "ALL") return undefined;
    return Object.values(SessionPackStatus).includes(status as SessionPackStatus)
      ? (status as SessionPackStatus)
      : undefined;
  }
}
