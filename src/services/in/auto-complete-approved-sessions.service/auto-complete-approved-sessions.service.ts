import { SessionPackStatus, SessionStatus } from "@prisma/client";
import { appConfig } from "../../../config/appConfig";
import {
  EmailService,
  buildSessionPackageCompletedEmail,
} from "../../out/email.service";
import { SessionService } from "../../out/session.service";
import { SessionPackageService } from "../../out/sessionPackage.service";

type AutoCompleteResult = {
  checkedSessionsCount: number;
  completedSessionsCount: number;
  completedPackagesCount: number;
};

export class AutoCompleteApprovedSessionsService {
  static async execute(): Promise<AutoCompleteResult> {
    console.log("Running auto-complete approved sessions service...");
    const now = new Date();

    const approvedSessions = await SessionService.getByStatusBefore(
      SessionStatus.APPROVED,
      now,
    );

    const completableSessions = approvedSessions.filter((session) => {
      const sessionEndAt = new Date(
        session.scheduledAt.getTime() + session.duration * 60 * 1000,
      );

      return sessionEndAt < now;
    });

    const completableSessionIds = completableSessions.map(
      (session) => session.id,
    );

    if (!completableSessionIds.length) {
      return {
        checkedSessionsCount: approvedSessions.length,
        completedSessionsCount: 0,
        completedPackagesCount: 0,
      };
    }

    const updatedSessions = await SessionService.updateMany({
      where: {
        id: { in: completableSessionIds },
        status: SessionStatus.APPROVED,
      },
      data: {
        status: SessionStatus.COMPLETED,
      },
    });

    const affectedPackageIds = Array.from(
      new Set(completableSessions.map((session) => session.sessionPackageId)),
    );

    let completedPackagesCount = 0;

    for (const sessionPackageId of affectedPackageIds) {
      const sessions =
        await SessionService.findManyBySessionPackageId(sessionPackageId);

      const allSessionsCompleted =
        sessions.length > 0 &&
        sessions.every((session) => session.status === SessionStatus.COMPLETED);

      if (!allSessionsCompleted) {
        continue;
      }

      const sessionPackage =
        await SessionPackageService.getById(sessionPackageId);

      if (
        !sessionPackage ||
        sessionPackage.status === SessionPackStatus.COMPLETED
      ) {
        continue;
      }

      await SessionPackageService.update(sessionPackageId, {
        status: SessionPackStatus.COMPLETED,
      });

      completedPackagesCount += 1;

      if (!sessionPackage.applicant.email || !sessionPackage.mentor.slug) {
        continue;
      }

      const rateUrl = `${appConfig.frontendUrl}/cabinet/testimonials/${sessionPackage.mentor.slug}`;

      try {
        await EmailService.sendEmail(
          buildSessionPackageCompletedEmail({
            applicant: sessionPackage.applicant,
            mentor: sessionPackage.mentor,
            sessions: sessionPackage.sessions,
            rateUrl,
            reportEmail: appConfig.resend.adminEmail,
          }),
        );
      } catch {
        console.error(
          `Failed to send package completed email for session package ${sessionPackageId}`,
        );
      }
    }

    console.log(
      `Checked ${approvedSessions.length} approved sessions, completed ${updatedSessions.count} sessions and ${completedPackagesCount} packages.`,
    );

    return {
      checkedSessionsCount: approvedSessions.length,
      completedSessionsCount: updatedSessions.count,
      completedPackagesCount,
    };
  }
}
