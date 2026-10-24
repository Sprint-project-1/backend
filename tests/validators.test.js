import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMovieId,
  parseFundingId,
  parseLimit,
  parseListQuery,
  parseMovieIds,
} from "../src/utils/validators.js";

test("parseMovieId: 올바른 값은 숫자로 바꿔 준다", () => {
  assert.equal(parseMovieId("1"), 1);
  assert.equal(parseMovieId("2147483647"), 2147483647);
});

test("parseMovieId: 잘못된 값은 400 오류를 던진다", () => {
  const badValues = ["0", "-1", "1.5", "abc", "01", " 1", "1e3", "2147483648", "", undefined];
  for (const value of badValues) {
    assert.throws(() => parseMovieId(value), {
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }
});

test("parseFundingId: BigInt로 돌려준다", () => {
  assert.equal(parseFundingId("9001"), 9001n);
  assert.equal(parseFundingId("9223372036854775807"), 9223372036854775807n);
});

test("parseFundingId: 범위를 넘거나 형식이 틀리면 400", () => {
  const badValues = ["0", "-5", "abc", "9223372036854775808"];
  for (const value of badValues) {
    assert.throws(() => parseFundingId(value), { status: 400 });
  }
});

test("parseLimit: 값이 없으면 기본값", () => {
  assert.equal(parseLimit(undefined, 20, 50), 20);
});

test("parseLimit: 정상 값과 경계값", () => {
  assert.equal(parseLimit("10", 20, 50), 10);
  assert.equal(parseLimit("50", 20, 50), 50);
});

test("parseLimit: 0, 최대 초과, 숫자 아님은 400", () => {
  const badValues = [ "0", "51", "abc", "1.5", "", ["1", "2"]];
  for (const value of badValues) {
    assert.throws(() => parseLimit(value, 20, 50), { status: 400 });
  }
});

test("parseListQuery: 아무것도 없으면 기본값", () => {
  assert.deepEqual(parseListQuery({}), {
    limit: 20,
    q: null,
    sortBy: null,
    order: null,
  });
});

test("parseListQuery: q는 앞뒤 공백을 제거하고, 공백뿐이면 null", () => {
  assert.equal(parseListQuery({ q: "  기생충 " }).q, "기생충");
  assert.equal(parseListQuery({ q: "   " }).q, null);
});

test("parseListQuery: sortBy만 있으면 order는 desc", () => {
  const result = parseListQuery({ sortBy: "amount" });
  assert.equal(result.sortBy, "amount");
  assert.equal(result.order, "desc");
});

test("parseListQuery: sortBy와 order를 함께 쓸 수 있다", () => {
  const result = parseListQuery({ sortBy: "achievementRate", order: "asc" });
  assert.equal(result.sortBy, "achievementRate");
  assert.equal(result.order, "asc");
});

test("parseListQuery: order만 있으면 400", () => {
  assert.throws(() => parseListQuery({ order: "asc" }), { status: 400 });
});

test("parseListQuery: 허용되지 않는 값은 400", () => {
  const badQueries = [
    { sortBy: "title" },
    { sortBy: "amount", order: "up" },
    { q: ["a", "b"] },
    { limit: "51" },
  ];
  for (const query of badQueries) {
    assert.throws(() => parseListQuery(query), { status: 400 });
  }
});

function expect400(body) {
  assert.throws(() => parseMovieIds(body), { status: 400});
}

test("parseMovieIds: 올바른 요청은 ID 배열을 그대로 돌려준다", () => {
  assert.deepEqual(parseMovieIds({ movieIds: [1, 2] }), [1, 2]);
  assert.deepEqual(parseMovieIds({ movieIds: [5, 3, 9] }), [5,3,9]);
  assert.deepEqual(parseMovieIds({ movieIds: [1,2,3,4,5] }), [1,2,3,4,5]);
  assert.deepEqual(parseMovieIds({ movieIds: [2147483647, 1] }), [2147483647, 1]);
});

test("parseMovieIds: 개수가 2~5개가 아니면 400", () => {
  expect400({ movieIds: [] });
  expect400({ movieIds: [1] });
  expect400({ movieIds: [1, 2, 3, 4, 5, 6] });
});

test("parseMovieIds: 같은 ID가 두 번 들어 있으면 400", () => {
  expect400({ movieIds: [1, 1] });
  expect400({ movieIds: [1, 2, 1] });
  expect400({ movieIds: [3, 4, 5, 6, 3] });
});

test("parseMoviesIds: 정수가 아닌 값이 있으면 400", () => {
  expect400({ movieIds: ["1", 2] });
  expect400({ movieIds: [1.5, 2] });
  expect400({ movieIds: [null, 2] });
  expect400({ movieIds: [true, 2] });
  expect400({ movieIds: [[1], 2] });
});

test("parseMovieIds: 1보다 작거나 너무 큰 ID가 있으면 400", () => {
  expect400({ movieIds: [0, 1] });
  expect400({ movieIds: [-1, 2] });
  expect400({ movieIds: [2147483648, 1] });
});

test("parseMovieIds: 본문 모양이 틀리면 400", () => {
  expect400(undefined);
  expect400(null);
  expect400("문자열");
  expect400([]);
  expect400({});
  expect400({ movieIds: "1,2"});
  expect400({ movieIds: { a: 1} });
});