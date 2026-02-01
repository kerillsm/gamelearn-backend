import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class AvailabilityService {
  static async createAvailabilityRule(
    availabilityRules: Prisma.AvailabilityRuleCreateManyInput[],
  ) {
    return prisma.availabilityRule.createMany({ data: availabilityRules });
  }

  static async removeByMentorUserId(mentorUserId: string) {
    return prisma.availabilityRule.deleteMany({
      where: { mentorUserId },
    });
  }

  static async getAvailabilityRulesByMentorUserId(mentorUserId: string) {
    return prisma.availabilityRule.findMany({
      where: { mentorUserId },
    });
  }

  static async createAvailabilityException(
    availabilityException: Prisma.AvailabilityExceptionCreateInput,
  ) {
    console.log("Creating availability exception:", availabilityException);
    return prisma.availabilityException.create({
      data: availabilityException,
    });
  }

  static async getAvailabilityExceptionsByMentorUserId(
    mentorUserId: string,
    dateFilter?: { gte?: Date; lte?: Date },
  ) {
    return prisma.availabilityException.findMany({
      where: { mentorUserId, date: dateFilter },
    });
  }

  static async deleteAvailabilityException(id: string, mentorUserId: string) {
    return prisma.availabilityException.delete({
      where: {
        id,
        mentorUserId,
      },
    });
  }
}
