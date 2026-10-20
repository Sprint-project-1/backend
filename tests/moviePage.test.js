import test from "node:test";
import assert from "node:assert/strict";
import { buildListPage, encodeCursor } from "../src/utils/moviePage.js";


function makeMovies(count) {
  const movies = [];
  for (let i = 1; i <= count; i++) {
    movies.push({
      movieId: i,
      title: "영화" + i,
      totalFundedAmount: BigInt(i * 10),
      productionBudget: 1000n,
    });
  }
  return movies;
}

function ids(movies) {
  return movies.map((movie) => movie.movieId);
}

const randomParams = { limit: 5, q: null, sortBy: null, order: null };

function makeCursor(overrides) {
  return encodeCursor({
    offset: 5,
    seed: 1,
    q: null,
    sortBy: null,
    order: null,
    limit: 5,
    ...overrides,
  });
}

test("랜덤 목록: 끝까지 넘겨도 중복·누락이 없다", () => {
  const movies = makeMovies(20);
  const seenIds = [];
  let cursor = undefined;
  let pageCount = 0;

  while (pageCount < 100) {
    const result = buildListPage(movies, randomParams, cursor);
    pageCount++;
    for (const movie of result.items) {
      seenIds.push(movie.movieId);
    }
    if (!result.page.hasMore) {
      assert.equal(result.page.nextCursor, null);
      break;
    }
    cursor = result.page.nextCursor;
  }

  assert.equal(pageCount, 4); 
  assert.equal(seenIds.length, 20);
  const sortedIds = [...seenIds].sort((a, b) => a - b);
  assert.deepEqual(sortedIds, ids(movies));
});

test("마지막 페이지는 남은 만큼만 담긴다", () => {
  const movies = makeMovies(12);
  let result = buildListPage(movies, randomParams, undefined);
  assert.equal(result.items.length, 5);
  result = buildListPage(movies, randomParams, result.page.nextCursor);
  assert.equal(result.items.length, 5);
  result = buildListPage(movies, randomParams, result.page.nextCursor);
  assert.equal(result.items.length, 2);
  assert.equal(result.page.hasMore, false);
  assert.equal(result.page.nextCursor, null);
});

test("펀딩액 정렬 목록도 cursor로 이어서 받을 수 있다", () => {
  const movies = makeMovies(12);
  const params = { limit: 5, q: null, sortBy: "amount", order: "desc" };

  const first = buildListPage(movies, params, undefined);
  assert.deepEqual(ids(first.items), [12, 11, 10, 9, 8]);
  assert.equal(first.page.hasMore, true);

  const second = buildListPage(movies, params, first.page.nextCursor);
  assert.deepEqual(ids(second.items), [7, 6, 5, 4, 3]);

  const third = buildListPage(movies, params, second.page.nextCursor);
  assert.deepEqual(ids(third.items), [2, 1]);
  assert.equal(third.page.hasMore, false);
  assert.equal(third.page.nextCursor, null);
});

test("영화가 없으면 빈 목록", () => {
  const result = buildListPage([], randomParams, undefined);
  assert.deepEqual(result, {
    items: [],
    page: { nextCursor: null, hasMore: false },
  });
});

test("올바른 cursor는 통과한다", () => {
  const movies = makeMovies(20);
  const result = buildListPage(movies, randomParams, makeCursor({}));
  assert.equal(result.items.length, 5);
});

test("잘못된 cursor는 400", () => {
  const movies = makeMovies(20);
  const badCursors = [
    "",
    "abc",
    "!!!",
    ["a", "b"],
    encodeCursor("문자열"),
    makeCursor({ offset: -1 }),
    makeCursor({ offset: 1.5 }),
    makeCursor({ seed: "x" }),
    makeCursor({ seed: null }), // 랜덤 모드인데 seed가 없음
  ];
  for (const cursor of badCursors) {
    assert.throws(() => buildListPage(movies, randomParams, cursor), {
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }
});

test("cursor를 만들 때와 요청 조건이 다르면 400", () => {
  const movies = makeMovies(20);
  const cursor = makeCursor({});

  const otherLimit = { ...randomParams, limit: 10 };
  const otherQuery = { ...randomParams, q: "영화" };
  const otherSort = { ...randomParams, sortBy: "amount", order: "desc" };

  for (const params of [otherLimit, otherQuery, otherSort]) {
    assert.throws(() => buildListPage(movies, params, cursor), { status: 400 });
  }
});
