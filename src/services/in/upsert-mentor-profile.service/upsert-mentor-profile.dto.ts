import { MentorGame } from "@prisma/client";

export interface UpsertMentorProfileDto {
  userId: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  game: MentorGame;
  tags: string[];
  price: number;
  gameRating?: number;
  videoUrl?: string;
}
