import { createError } from "../errors/createError.js";

const MAX_SEEN_IDS = 100; // CineFund 영화 최대 100편
const MAX_MOVIE_ID = 2147483647; // PostgreSQL Int 최대값
const MAX_CURSOR_LENGTH = 4096; // 너무 긴 커서 차단

function invalidCursor() {
  return createError(400, "VALIDATION_ERROR", "요청 값을 확인해 주세요.");
}

export function encodeRankingCursor(seenIds, params) {
  const data = {
    version: 1, // 랭킹 커서 버전
    seenIds, // 지금까지 보여준 영화 ID 목록
    limit: params.limit,
    sortBy: params.sortBy,
    order: params.order,
  };

  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

export function decodeRankingCursor(text, params) {
  if (
    typeof text !== "string" ||
    text.length === 0 ||
    text.length > MAX_CURSOR_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(text)
  ) {
    throw invalidCursor();
  }

  let data;

  try {
    const encoded = Buffer.from(text, "base64url");

    if (encoded.toString("base64url") !== text) {
      throw new Error("invalid base64url");
    }

    data = JSON.parse(encoded.toString("utf8"));
  } catch {
    throw invalidCursor();
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw invalidCursor();
  }

  // 커서를 생성했을 때와 정렬 조건이 같은지 검사
  if (
    data.version !== 1 ||
    data.limit !== params.limit ||
    data.sortBy !== params.sortBy ||
    data.order !== params.order
  ) {
    throw invalidCursor();
  }

  // 이전에 조회한 영화 ID가 정상적인지 검사
  if (
    !Array.isArray(data.seenIds) ||
    data.seenIds.length < 1 ||
    data.seenIds.length > MAX_SEEN_IDS ||
    data.seenIds.some(
      (id) => !Number.isInteger(id) || id < 1 || id > MAX_MOVIE_ID,
    ) ||
    new Set(data.seenIds).size !== data.seenIds.length
  ) {
    throw invalidCursor();
  }

  return data.seenIds;
}
