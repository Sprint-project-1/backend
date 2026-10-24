import test from "node:test";
import assert from "node:assert/strict";
import { toMovieResponse } from "../src/utils/movieResponse.js";

const dbMovie = {
  movieId: 1,
  tmdbId: 969681,
  title: "테스트 영화",
  originalTitle: null,
  koreanCertification: "12",
  posterPath: null,
  overview: null,
  director: null,
  actors: ["배우"],
  releaseDate: new Date("2026-07-29T00:00:00.000Z"),
  genres: ["SF"],
  tagline: null,
  productionBudget: 225000000n,
  totalFundedAmount: 0n,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("BigInt는 문자열로, 날짜는 YYYY-MM-DD로 바꾼다", () => {
  const result = toMovieResponse(dbMovie);
  assert.equal(result.productionBudget, "225000000");
  assert.equal(result.totalFundedAmount, "0");
  assert.equal(result.releaseDate, "2026-07-29");
});

test("명세에 없는 필드는 응답에 넣지 않는다", () => {
  const result = toMovieResponse(dbMovie);
  assert.equal(result.createdAt, undefined);
  assert.equal(result.updatedAt, undefined);
});

test("제작비와 개봉일이 null이면 null로 유지한다", () => {
  const result = toMovieResponse({
    ...dbMovie,
    productionBudget: null,
    releaseDate: null,
  });
  assert.equal(result.productionBudget, null);
  assert.equal(result.releaseDate, null);
});

test("공통 영화 모델의 필드 14개를 모두 가진다", () => {
  const result = toMovieResponse(dbMovie);
  const expectedKeys = [
    "movieId", "tmdbId", "title", "originalTitle", "koreanCertification",
    "posterPath", "overview", "director", "actors", "releaseDate",
    "genres", "tagline", "productionBudget", "totalFundedAmount",
  ];
  assert.deepEqual(Object.keys(result), expectedKeys);
});
