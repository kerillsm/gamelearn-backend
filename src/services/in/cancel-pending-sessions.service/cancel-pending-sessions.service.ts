import { SessionService } from "../../out/session.service";

export class CancelPendingSessionsService {
  static async execute(sessionIds: string[], userId: string) {
    const deletedCount = await SessionService.deletePendingByIds(sessionIds);
    console.log(`Canceled ${deletedCount.count} pending session(s) for user ${userId}`);
    return deletedCount;
  }
}
