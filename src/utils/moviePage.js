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
  if (!Number.isInteger(data.offset) || data.offset < 1) {
    throw invalidCursor();
  }
  if (data.seed !== null && !Number.isInteger(data.seed)) {
    throw invalidCursor();
  }

  if (
    data.q !== params.q ||
    data.sortBy !== params.sortBy ||
    data.order !== params.order ||
    data.limit !== params.limit
  ) {
    throw invalidCursor();
  }

  const isRandomMode = params.sortBy === null && params.q === null;
  if (isRandomMode && data.seed === null) {
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
