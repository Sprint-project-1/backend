import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { findDestructiveStatements, hasApprovedLegacyHash } from "../scripts/checkMigrations.js";

test("migration safety guard detects destructive DDL and DML", () => {
  const statements = findDestructiveStatements(`
    ALTER TABLE movies DROP COLUMN funding_goal;
    TRUNCATE TABLE fundings;
    DELETE FROM movies;
  `);

  assert.deepEqual(statements.map(({ kind }) => kind).sort(), ["DELETE FROM", "DROP", "TRUNCATE"]);
});

test("migration safety guard ignores SQL comments", () => {
  assert.deepEqual(
    findDestructiveStatements(`
      -- DROP TABLE movies;
      /* TRUNCATE TABLE movies; */
      CREATE TABLE movies (movie_id SERIAL PRIMARY KEY);
    `),
    [],
  );
});

test("migration safety guard does not reject additive schema changes", () => {
  assert.deepEqual(
    findDestructiveStatements(`
      ALTER TABLE movies ADD COLUMN tagline TEXT;
      CREATE INDEX movies_title_idx ON movies(title);
    `),
    [],
  );
});

test("approved applied migration is immutable and protected by its exact file hash", async () => {
  const relativePath = "20261019120000_remove_funding_goal/migration.sql";
  const sql = await readFile(new URL(`../prisma/migrations/${relativePath}`, import.meta.url), "utf8");

  assert.equal(hasApprovedLegacyHash(relativePath, sql), true);
  assert.equal(hasApprovedLegacyHash(relativePath, `${sql}\nDROP TABLE movies;`), false);
});
