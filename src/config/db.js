import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as FundingPrismaClient } from "../../node_modules/@prisma/client/funding-client/index.js";
import { getFundingDatabaseUrl } from "./database.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL이 없습니다. .env.example을 .env로 복사해 주세요.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

const fundingDatabaseUrl = getFundingDatabaseUrl();
const fundingAdapter = new PrismaPg({ connectionString: fundingDatabaseUrl });
export const fundingPrisma = new FundingPrismaClient({
  adapter: fundingAdapter,
});
