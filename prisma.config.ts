import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getSafeEnv } from "./utils/getSafeEnv";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getSafeEnv("DATABASE_URL"),
  },
});
