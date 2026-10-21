import { createError } from "../errors/createError.js";
import {
  sortMovies,
  compareByAmount,
  compareByAchievementRate,
} from "./movieSort.js";

const MAX_MOVIE_ID = 2147483647; // DB Int(32비트) 최댓값

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

// "0" 또는 0으로 시작하지 않는 숫자로만 된 문자열인지 검사한다.
function isDigits(value) {
  if (typeof value !== "string") {
    return false;
  }
  return /^(0|[1-9][0-9]*)$/.test(value);
}

// 랜덤·제목 정렬 cursor (offset 방식)를 검사한다.
function checkOffsetCursor(data, params) {
  if (!Number.isInteger(data.offset) || data.offset < 1) {
    throw invalidCursor();
  }
  if (data.offset % params.limit !== 0) {
    throw invalidCursor();
  }

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

// 금액·달성률 정렬 cursor (keyset 방식)에서 "마지막으로 본 영화"를 꺼내 검사한다.
// 돌려주는 모양: { movieId, totalFundedAmount, productionBudget } (금액은 BigInt)
function readLastMovie(data) {
  const last = data.last;
  if (typeof last !== "object" || last === null) {
    throw invalidCursor();
  }
  if (!Number.isInteger(last.movieId) || last.movieId < 1 || last.movieId > MAX_MOVIE_ID) {
    throw invalidCursor();
  }
  if (!isDigits(last.totalFundedAmount)) {
    throw invalidCursor();
  }
  if (last.productionBudget !== null && !isDigits(last.productionBudget)) {
    throw invalidCursor();
  }

  let productionBudget = null;
  if (last.productionBudget !== null) {
    productionBudget = BigInt(last.productionBudget);
  }

  return {
    movieId: last.movieId,
    totalFundedAmount: BigInt(last.totalFundedAmount),
    productionBudget: productionBudget,
  };
}

// cursor 문자열을 읽어서 검사한다. 잘못됐으면 400을 던진다.
// 랜덤·제목 정렬이면 { offset, seed, ... }, 금액·달성률 정렬이면 "마지막으로 본 영화"를 돌려준다.
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

  // 정렬 방식에 따라 cursor의 모양이 다르다.
  if (params.sortBy !== null) {
    return readLastMovie(data);
  }
  return checkOffsetCursor(data, params);
}

// 금액·달성률 정렬 cursor를 만든다. lastItem은 이번 페이지의 마지막 영화.
function makeKeysetCursor(lastItem, params) {
  let productionBudget = null;
  if (lastItem.productionBudget !== null) {
    productionBudget = lastItem.productionBudget.toString();
  }

  return encodeCursor({
    last: {
      movieId: lastItem.movieId,
      totalFundedAmount: lastItem.totalFundedAmount.toString(),
      productionBudget: productionBudget,
    },
    q: params.q,
    sortBy: params.sortBy,
    order: params.order,
    limit: params.limit,
  });
}

// 정렬 순서에서 movie가 lastMovie보다 "뒤에" 오는지 판단한다.
function comesAfter(movie, lastMovie, params) {
  if (params.sortBy === "amount") {
    return compareByAmount(movie, lastMovie, params.order) > 0;
  }
  return compareByAchievementRate(movie, lastMovie, params.order) > 0;
}

export function buildListPage(movies, params, cursorText) {
  const isKeysetMode = params.sortBy !== null;
  const isRandomMode = params.sortBy === null && params.q === null;

  let offset = 0;
  let seed = null;
  let lastMovie = null;

  if (cursorText !== undefined) {
    const cursor = decodeCursor(cursorText, params);
    if (isKeysetMode) {
      lastMovie = cursor;
    } else {
      offset = cursor.offset;
      seed = cursor.seed;
    }
  } else if (isRandomMode) {
    seed = makeSeed();
  }

  const sorted = sortMovies(movies, params, seed);

  // 이번 페이지에 올 수 있는 후보: 이미 지나간 영화를 뺀 나머지
  let candidates;
  if (isKeysetMode) {
    candidates = sorted;
    if (lastMovie !== null) {
      candidates = sorted.filter((movie) => comesAfter(movie, lastMovie, params));
    }
  } else {
    if (cursorText !== undefined && offset >= sorted.length) {
      throw invalidCursor();
    }
    candidates = sorted.slice(offset);
  }

  const items = candidates.slice(0, params.limit);
  const hasMore = candidates.length > params.limit;

  let nextCursor = null;
  if (hasMore) {
    if (isKeysetMode) {
      nextCursor = makeKeysetCursor(items[items.length - 1], params);
    } else {
      nextCursor = encodeCursor({
        offset: offset + params.limit,
        seed: seed,
        q: params.q,
        sortBy: params.sortBy,
        order: params.order,
        limit: params.limit,
      });
    }
  }

  return {
    items: items,
    page: { nextCursor: nextCursor, hasMore: hasMore },
  };
}
