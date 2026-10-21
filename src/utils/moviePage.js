import { createError } from "../errors/createError.js";
import { sortMovies } from "./movieSort.js";

function invalidCursor() {
  return createError(400, "VALIDATION_ERROR", "요청 값을 확인해 주세요.");
}

function makeSeed() {
  return Math.floor(Math.random() * 1000000000);
}

export function encodeCursor(data) {
  const json = JSON.stringify(data);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCursor(text, params) {
  if (typeof text !== "string") {
    throw invalidCursor();
  }

  let data;
  try {
    const json = Buffer.from(text, "base64url").toString("utf8");
    data = JSON.parse(json);
  } catch (error) {
    throw invalidCursor();
  }

  if (typeof data !== "object" || data === null) {
    throw invalidCursor();
  }

  // cursor를 만들 때의 조건이 지금 요청과 같아야 한다.
  if (
    data.q !== params.q ||
    data.sortBy !== params.sortBy ||
    data.order !== params.order ||
    data.limit !== params.limit
  ) {
    throw invalidCursor();
  }

  // 시작 위치는 1 이상의 정수이고, 서버는 항상 limit의 배수로 만든다.
  if (!Number.isInteger(data.offset) || data.offset < 1) {
    throw invalidCursor();
  }
  if (data.offset % params.limit !== 0) {
    throw invalidCursor();
  }

  // 랜덤 모드에서만 seed가 있고(makeSeed 범위), 그 밖의 모드에서는 seed가 없어야 한다.
  const isRandomMode = params.sortBy === null && params.q === null;
  if (isRandomMode) {
    if (!Number.isInteger(data.seed) || data.seed < 0 || data.seed >= 1000000000) {
      throw invalidCursor();
    }
  } else if (data.seed !== null) {
    throw invalidCursor();
  }

  return data;
}

export function buildListPage(movies, params, cursorText) {
  const isRandomMode = params.sortBy === null && params.q === null;

  let offset = 0;
  let seed = null;

  if (cursorText !== undefined) {
    const cursor = decodeCursor(cursorText, params);
    offset = cursor.offset;
    seed = cursor.seed;
  } else if (isRandomMode) {
    seed = makeSeed();
  }

  const sorted = sortMovies(movies, params, seed);

  // cursor로 온 요청이라면 offset은 전체 개수보다 작아야 한다.
  // (서버는 다음 항목이 있을 때만 cursor를 만들기 때문)
  if (cursorText !== undefined && offset >= sorted.length) {
    throw invalidCursor();
  }

  const items = sorted.slice(offset, offset + params.limit);

  const nextOffset = offset + params.limit;
  const hasMore = nextOffset < sorted.length;

  let nextCursor = null;
  if (hasMore) {
    nextCursor = encodeCursor({
      offset: nextOffset,
      seed: seed,
      q: params.q,
      sortBy: params.sortBy,
      order: params.order,
      limit: params.limit,
    });
  }

  return {
    items: items,
    page: { nextCursor: nextCursor, hasMore: hasMore },
  };
}
