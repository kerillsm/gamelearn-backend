import { MentorApplicationService } from "../../out/mentorApplication.service";
import { MentorApplicationStatus } from "@prisma/client";

export class ListMentorApplicationsService {
  static async execute(params: {
    page?: number;
    take?: number;
    status?: MentorApplicationStatus;
  }) {
    const { page = 1, take = 10, status } = params;
    const skip = (page - 1) * take;
    const statusFilter = status
      ? { equals: status }
      : undefined;

    const [applications, totalCount] = await Promise.all([
      MentorApplicationService.getApplicationList(
        take,
        skip,
        statusFilter,
      ),
      MentorApplicationService.countApplications(statusFilter),
    ]);

    return { applications, totalCount };
  }
}
