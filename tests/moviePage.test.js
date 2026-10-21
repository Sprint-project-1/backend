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
test("금액 정렬: 페이지를 넘기는 사이 순위가 바뀌어도 이미 본 영화가 다시 나오지 않는다", () => {
  const movies = makeMovies(12);
  const params = { limit: 5, q: null, sortBy: "amount", order: "desc" };

  const first = buildListPage(movies, params, undefined);
  assert.deepEqual(ids(first.items), [12, 11, 10, 9, 8]);

  // 첫 페이지를 본 뒤, 3번 영화가 펀딩을 많이 받아 1등이 된다.
  const changedMovies = makeMovies(12);
  changedMovies[2].totalFundedAmount = 1000n;

  const second = buildListPage(changedMovies, params, first.page.nextCursor);
  assert.deepEqual(ids(second.items), [7, 6, 5, 4, 2]);

  const third = buildListPage(changedMovies, params, second.page.nextCursor);
  assert.deepEqual(ids(third.items), [1]);
  assert.equal(third.page.hasMore, false);
  assert.equal(third.page.nextCursor, null);
});

test("달성률 정렬도 cursor로 이어 받고, 계산할 수 없는 영화는 맨 뒤에 온다", () => {
  const movies = [
    { movieId: 1, title: "a", totalFundedAmount: 50n, productionBudget: 100n },
    { movieId: 2, title: "b", totalFundedAmount: 10n, productionBudget: 100n },
    { movieId: 3, title: "c", totalFundedAmount: 0n, productionBudget: null },
    { movieId: 4, title: "d", totalFundedAmount: 5n, productionBudget: 0n },
    { movieId: 5, title: "e", totalFundedAmount: 30n, productionBudget: 60n },
  ];
  const params = { limit: 2, q: null, sortBy: "achievementRate", order: "desc" };

  const first = buildListPage(movies, params, undefined);
  assert.deepEqual(ids(first.items), [1, 5]);
  const second = buildListPage(movies, params, first.page.nextCursor);
  assert.deepEqual(ids(second.items), [2, 3]);
  const third = buildListPage(movies, params, second.page.nextCursor);
  assert.deepEqual(ids(third.items), [4]);
  assert.equal(third.page.hasMore, false);
});

test("금액 정렬 cursor의 내용이 잘못되면 400", () => {
  const movies = makeMovies(12);
  const params = { limit: 5, q: null, sortBy: "amount", order: "desc" };

  function keysetCursor(last) {
    return encodeCursor({ last: last, q: null, sortBy: "amount", order: "desc", limit: 5 });
  }

  const badLasts = [
    undefined,
    null,
    "문자열",
    {},
    { movieId: 0, totalFundedAmount: "10", productionBudget: "100" },
    { movieId: 3, totalFundedAmount: 10, productionBudget: "100" },
    { movieId: 3, totalFundedAmount: "-10", productionBudget: "100" },
    { movieId: 3, totalFundedAmount: "01", productionBudget: "100" },
    { movieId: 3, totalFundedAmount: "10", productionBudget: 100 },
    { movieId: 3, totalFundedAmount: "abc", productionBudget: null },
  ];
  for (const last of badLasts) {
    assert.throws(() => buildListPage(movies, params, keysetCursor(last)), { status: 400 });
  }

  // 올바른 값이면 통과한다.
  const ok = keysetCursor({ movieId: 8, totalFundedAmount: "80", productionBudget: "1000" });
  assert.deepEqual(ids(buildListPage(movies, params, ok).items), [7, 6, 5, 4, 3]);
});

test("cursor의 offset이 전체 개수 이상이면 400", () => {
  const movies = makeMovies(20);
  for (const offset of [20, 100000]) {
    assert.throws(
      () => buildListPage(movies, randomParams, makeCursor({ offset: offset })),
      { status: 400 },
    );
  }
});

test("cursor의 offset이 limit의 배수가 아니면 400", () => {
  const movies = makeMovies(20);
  assert.throws(
    () => buildListPage(movies, randomParams, makeCursor({ offset: 7 })),
    { status: 400 },
  );
});

test("cursor의 seed가 범위를 벗어나거나 모드와 맞지 않으면 400", () => {
  const movies = makeMovies(20);
  for (const seed of [-5, 1e300]) {
    assert.throws(
      () => buildListPage(movies, randomParams, makeCursor({ seed: seed })),
      { status: 400 },
    );
  }

  // 금액 정렬 모드인데 seed가 있는 cursor
  const amountParams = { limit: 5, q: null, sortBy: "amount", order: "desc" };
  const cursor = makeCursor({ seed: 123, sortBy: "amount", order: "desc" });
  assert.throws(() => buildListPage(movies, amountParams, cursor), { status: 400 });
});
