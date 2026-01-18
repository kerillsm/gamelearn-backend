import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getSafeEnv } from "./src/lib/config/getSafeEnv";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getSafeEnv("DATABASE_URL"),
  },
});
