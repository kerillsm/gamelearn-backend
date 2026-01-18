import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getSafeEnv } from "../config/getSafeEnv";

const adapter = new PrismaPg({
  connectionString: getSafeEnv("DATABASE_URL"),
});

export const prisma = new PrismaClient({ adapter });
