import * as Sentry from "@sentry/node";
import { SessionPackStatus } from "@prisma/client";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { RejectSessionPackageService } from "../reject-session-package.service";

type AutoRejectResult = {
  checked: number;
  rejected: number;
  failed: number;
};

export class AutoRejectExpiredPackagesService {
  static async execute(): Promise<AutoRejectResult> {
    console.log("Running auto-reject expired packages service...");

    // Calculate threshold: 1 hour from now
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    // Get all PAYED session packages with their sessions
    const payedPackages = await SessionPackageService.getAll(
      {
        status: SessionPackStatus.PAYED,
        sessions: {
          some: {
            scheduledAt: {
              lte: oneHourFromNow,
            },
          },
        },
      },
      {
        sessions: {
          orderBy: { scheduledAt: "asc" },
        },
        mentor: true,
        applicant: true,
      },
    );

    console.log(`Found ${payedPackages.length} PAYED packages to check`);

    // Filter packages where earliest session starts within the next hour
    const packagesToReject = payedPackages.filter((pkg) => {
      if (pkg.sessions.length === 0) return false;

      // Find the earliest session time regardless of order
      const earliestTime = Math.min(
        ...pkg.sessions.map((s) => s.scheduledAt.getTime()),
      );

      return earliestTime <= oneHourFromNow.getTime();
    });

    console.log(
      `Found ${packagesToReject.length} packages to auto-reject (earliest session starts within 1 hour)`,
    );

    let rejected = 0;
    let failed = 0;

    for (const pkg of packagesToReject) {
      const earliestSession = pkg.sessions.sort(
        (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
      )[0];

      try {
        console.log(
          `Auto-rejecting package ${pkg.id} (earliest session at ${earliestSession.scheduledAt})`,
        );

        await RejectSessionPackageService.execute(
          pkg.id,
          pkg.mentorId,
          "Automatically rejected due to missed approval deadline",
          true, // notifyMentor = true
        );

        rejected++;
        console.log(`Successfully auto-rejected package ${pkg.id}`);
      } catch (error) {
        failed++;
        console.error(`Failed to auto-reject package ${pkg.id}:`, error);

        // Send error to Sentry for monitoring
        Sentry.captureException(error, {
          tags: {
            service: "auto-reject-expired-packages",
            action: "auto-reject",
          },
          extra: {
            sessionPackageId: pkg.id,
            mentorId: pkg.mentorId,
            applicantId: pkg.applicantId,
            earliestSessionScheduledAt: earliestSession.scheduledAt,
          },
        });

        // Continue with next package even if this one fails
      }
    }

    const result = {
      checked: payedPackages.length,
      rejected,
      failed,
    };

    console.log(
      `Auto-reject service completed: ${result.checked} checked, ${result.rejected} rejected, ${result.failed} failed`,
    );

    return result;
  }
}
