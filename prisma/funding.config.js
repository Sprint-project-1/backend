import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getFundingDatabaseUrl } from "../src/config/database.js";

export default defineConfig({
  schema: "funding/schema.prisma",
  migrations: {
    path: "funding/migrations",
  },
  datasource: {
    url: getFundingDatabaseUrl(),
  },
});
