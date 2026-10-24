import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MIGRATIONS_DIR = join(ROOT, "prisma", "migrations");

// This migration is already applied in team databases. Keep its history immutable;
// the hash prevents new destructive SQL from being hidden in the legacy exception.
const APPROVED_LEGACY_MIGRATIONS = new Map([
  [
    "20261019120000_remove_funding_goal/migration.sql",
    "18ea3bfafec5a79026621e542fa902c4836cf9a9303695839c0255a37a0e07a4",
  ],
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function findDestructiveStatements(sql) {
  const withoutComments = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\r\n]*/g, " ");
  const patterns = [
    ["DROP", /\bDROP\b/gi],
    ["TRUNCATE", /\bTRUNCATE\b/gi],
    ["DELETE FROM", /\bDELETE\s+FROM\b/gi],
  ];

  return patterns.flatMap(([kind, pattern]) =>
    [...withoutComments.matchAll(pattern)].map((match) => ({
      kind,
      statement: match[0].replace(/\s+/g, " ").toUpperCase(),
    })),
  );
}

export function hasApprovedLegacyHash(relativePath, sql) {
  const expectedHash = APPROVED_LEGACY_MIGRATIONS.get(relativePath);
  return expectedHash !== undefined && sha256(sql) === expectedHash;
}

async function main() {
  const folders = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const errors = [];

  for (const folder of folders) {
    const relativePath = `${folder}/migration.sql`;
    const migrationPath = join(MIGRATIONS_DIR, relativePath);
    let sql;
    try {
      sql = await readFile(migrationPath, "utf8");
    } catch (error) {
      errors.push(`${relativePath}: migration.sql을 읽을 수 없습니다 (${error.message})`);
      continue;
    }

    if (APPROVED_LEGACY_MIGRATIONS.has(relativePath)) {
      if (!hasApprovedLegacyHash(relativePath, sql)) {
        errors.push(`${relativePath}: 적용된 기존 migration이 변경되었습니다. migration 이력을 다시 쓰지 마세요.`);
      }
      continue;
    }

    const destructive = findDestructiveStatements(sql);
    for (const { kind, statement } of destructive) {
      errors.push(`${relativePath}: destructive SQL 금지 (${kind}: ${statement})`);
    }
  }

  if (errors.length > 0) {
    console.error(errors.map((error) => `✗ ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("Migration 안전성 검사 통과 (기존 승인 migration은 해시로 고정)");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
