import "dotenv/config";
import { Pool } from "pg";
import { DATABASE_NAMES } from "../src/config/database.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL이 설정되지 않았습니다.");
}

const adminUrl = new URL(process.env.DATABASE_URL);
adminUrl.pathname = "/postgres";
adminUrl.searchParams.delete("schema");
const pool = new Pool({ connectionString: adminUrl.toString() });

try {
  const { rows } = await pool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [DATABASE_NAMES.funding],
  );
  if (rows.length === 0) {
    await pool.query(`CREATE DATABASE "${DATABASE_NAMES.funding}"`);
    console.log(`${DATABASE_NAMES.funding} 데이터베이스를 생성했습니다.`);
  } else {
    console.log(`${DATABASE_NAMES.funding} 데이터베이스가 이미 있습니다.`);
  }
} finally {
  await pool.end();
}
