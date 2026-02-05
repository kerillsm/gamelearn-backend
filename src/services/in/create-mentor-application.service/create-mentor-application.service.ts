import { MentorGame } from "@prisma/client";
import { MentorApplicationService } from "../../out/mentorApplication.service";
import { HttpError } from "../../../lib/formatters/httpError";

export class CreateMentorApplicationService {
  static async createApplication(
    userId: string,
    dto: {
      name: string;
      game: MentorGame;
      rating: number;
      experiencePlaying: string;
      experienceTeaching?: string;
      socialMedia?: string;
      aboutYourself?: string;
      contactInfo: string;
      steamProfile: string;
    },
  ) {
    try {
      const application = await MentorApplicationService.createApplication({
        name: dto.name,
        game: dto.game,
        rating: dto.rating,
        experiencePlaying: dto.experiencePlaying,
        experienceTeaching: dto.experienceTeaching,
        socialMedia: dto.socialMedia,
        aboutYourself: dto.aboutYourself,
        contactInfo: dto.contactInfo,
        steamProfile: dto.steamProfile,
        user: { connect: { id: userId } },
      });

      return application;
    } catch (error: unknown) {
      if ((error as any).code === "P2014") {
        throw new HttpError(400, "You have already submitted an application");
      }

      throw new HttpError(
        500,
        (error as Error)?.message || "Failed to create mentor application",
      );
    }
  }
}
