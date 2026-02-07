import { MentorProfileService } from "../../out/mentorProfile.service";

export class ListAllProfilesService {
  static async execute(params: { page?: number; take?: number }) {
    return MentorProfileService.getMentorProfilesAll(params);
  }
}
