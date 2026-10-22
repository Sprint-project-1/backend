import "dotenv/config";
import { Pool } from "pg";
import { getFundingDatabaseUrl } from "../src/config/database.js";

const source = new Pool({ connectionString: process.env.DATABASE_URL });
const destination = new Pool({ connectionString: getFundingDatabaseUrl() });

async function main() {
  const { rows: tableCheck } = await source.query(
    "SELECT to_regclass('public.fundings') IS NOT NULL AS exists",
  );
  if (!tableCheck[0].exists) {
    console.log("기존 fundings 테이블이 없어 이관할 기록이 없습니다.");
    return;
  }

  const { rows: mismatches } = await source.query(`
    SELECT m.movie_id
    FROM movies AS m
    LEFT JOIN fundings AS f ON f.movie_id = m.movie_id
    GROUP BY m.movie_id, m.total_funded_amount
    HAVING m.total_funded_amount <> COALESCE(SUM(f.amount), 0)
  `);
  if (mismatches.length > 0) {
    throw new Error(
      `영화 누적액과 Funding 원장이 다른 영화가 ${mismatches.length}편 있습니다. 데이터 확인 후 이관을 다시 실행해 주세요.`,
    );
  }

  const { rows } = await source.query(
    `SELECT funding_id, movie_id, nickname, amount, comment, password_hash,
            created_at, updated_at
     FROM fundings ORDER BY funding_id`,
  );

  const client = await destination.connect();
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      await client.query(
        `INSERT INTO fundings
           (funding_id, movie_id, nickname, amount, comment, password_hash,
            created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (funding_id) DO UPDATE SET
           movie_id = EXCLUDED.movie_id,
           nickname = EXCLUDED.nickname,
           amount = EXCLUDED.amount,
           comment = EXCLUDED.comment,
           password_hash = EXCLUDED.password_hash,
           created_at = EXCLUDED.created_at,
           updated_at = EXCLUDED.updated_at`,
        [
          row.funding_id,
          row.movie_id,
          row.nickname,
          row.amount,
          row.comment,
          row.password_hash,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('fundings', 'funding_id'),
        COALESCE(MAX(funding_id), 1),
        COUNT(*) > 0
      )
      FROM fundings
    `);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const { rows: migratedIds } = await destination.query(
    "SELECT funding_id FROM fundings WHERE funding_id = ANY($1::bigint[])",
    [rows.map((row) => row.funding_id)],
  );
  if (migratedIds.length !== rows.length) {
    throw new Error("Funding 데이터 이관 검증에 실패했습니다.");
  }

  console.log(`Funding 데이터 ${rows.length}건을 새 DB로 이관했습니다.`);
}

main()
  .catch((error) => {
    console.error(`Funding 데이터 이관 실패: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([source.end(), destination.end()]);
  });
