import { MentorApplicationStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { MentorApplicationService } from "../../out/mentorApplication.service";

export class RejectMentorApplicationService {
  static async execute(applicationId: string, rejectionReason: string) {
    const application = await MentorApplicationService.getById(applicationId);
    if (!application) {
      throw new HttpError(404, "Application not found");
    }
    if (application.status !== MentorApplicationStatus.PENDING) {
      throw new HttpError(400, "Application is not pending");
    }

    const updated = await MentorApplicationService.updateStatus(
      applicationId,
      MentorApplicationStatus.REJECTED,
      rejectionReason.trim(),
    );
    return updated;
  }
}
