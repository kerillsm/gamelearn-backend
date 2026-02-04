import { SessionStatus } from "@prisma/client";
import { SessionService } from "../../out/session.service";

const PAGE_SIZE = 10;

export class ListSessionsService {
  static async listUserSessions(userId: string, page = 1, status?: string) {
    const result = await SessionService.listSessions(
      { userId },
      { page, pageSize: PAGE_SIZE, status: this.parseStatus(status) },
    );
    return { ...result, page, pageSize: PAGE_SIZE };
  }

  static async listMentorSessions(mentorUserId: string, page = 1, status?: string) {
    const result = await SessionService.listSessions(
      { mentorUserId },
      { page, pageSize: PAGE_SIZE, status: this.parseStatus(status) },
    );
    return { ...result, page, pageSize: PAGE_SIZE };
  }

  private static parseStatus(status?: string): SessionStatus | undefined {
    if (!status || status === "ALL") return undefined;
    return Object.values(SessionStatus).includes(status as SessionStatus)
      ? (status as SessionStatus)
      : undefined;
  }
}
