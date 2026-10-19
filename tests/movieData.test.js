import test from "node:test";
import assert from "node:assert/strict";
import { actorsFromCredits, directorsFromCredits, isValidMovieIds, koreanMovieRating, moviePath,
  MIN_BUDGET_KRW, MIN_BUDGET_USD, USD_KRW_RATE, meetsMinimumBudget, validateMovieDetails
} from "../src/movies/movieData.js";

test("movieDetails.json must contain exactly 100 unique valid movie IDs", () => {
  const ids = Array.from({ length: 100 }, (_, index) => index + 1);
  assert.equal(isValidMovieIds(ids), true);
  assert.equal(isValidMovieIds([...ids.slice(0, 99), 1]), false);
  assert.equal(isValidMovieIds(ids.slice(0, 99)), false);
  assert.equal(isValidMovieIds([...ids.slice(0, 99), 2147483648]), false);
});

test("movie API path is stable", () => {
  assert.equal(moviePath(550), "/movie/550");
});

test("reject Korean 19+ ratings and unknown ratings", () => {
  assert.equal(koreanMovieRating({ results: [{ iso_3166_1: "KR", release_dates: [{ certification: "19" }] }] }), null);
  assert.equal(koreanMovieRating({ results: [{ iso_3166_1: "KR", release_dates: [{ certification: "15" }] }] }), "15");
  assert.equal(koreanMovieRating({ results: [] }), null);
});

test("TMDB credits에서 감독 이름만 추출 (중복 제거)", () => {
  assert.equal(directorsFromCredits({ crew: [
    { job: "Director", name: "김감독" },
    { job: "Producer", name: "제작자" },
    { job: "Director", name: "김감독" },
    { job: "Director", name: "이감독" },
  ] }), "김감독, 이감독");
  assert.equal(directorsFromCredits({ crew: [] }), null);
});

test("TMDB credits에서 출연 배우는 최대 10명, 빈 값·중복 제외", () => {
  assert.deepEqual(actorsFromCredits({ cast: [
    { name: "배우 A" },
    { name: "배우 A" },
    { name: " 배우 B " },
    { name: " " },
    ...Array.from({ length: 12 }, (_, i) => ({ name: `배우 ${i}` })),
  ] }), ["배우 A", "배우 B", ...Array.from({ length: 8 }, (_, i) => `배우 ${i}`)]);
  assert.deepEqual(actorsFromCredits({ crew: [{ name: "감독" }] }), []);
  assert.deepEqual(actorsFromCredits(null), []);
});

test("제작비 최소 3,500만 원(고정 환율 1 USD = 1,400원) 기준을 적용", () => {
  assert.equal(MIN_BUDGET_KRW, 35_000_000);
  assert.equal(USD_KRW_RATE, 1400);
  assert.equal(MIN_BUDGET_USD, 25_000);
  assert.equal(meetsMinimumBudget(25_000), true); // 정확히 기준액
  assert.equal(meetsMinimumBudget(24_999), false);
  assert.equal(meetsMinimumBudget(0), false);
  assert.equal(meetsMinimumBudget(null), false);
  assert.equal(meetsMinimumBudget(undefined), false);
  assert.equal(meetsMinimumBudget(-1), false);
  assert.equal(meetsMinimumBudget(25_000.5), false);
});

test("시드 데이터 검증: 영화 100편 중 한 편이라도 제작비 기준 미달이면 차단", () => {
  const sample = Array.from({ length: 100 }, (_, i) => ({
    tmdbId: i + 1,
    title: `영화 ${i + 1}`,
    director: null,
    genres: ["드라마"],
    actors: ["배우 A", "배우 B"],
    overview: "설명",
    posterPath: null,
    budget: MIN_BUDGET_USD,
  }));
  assert.equal(validateMovieDetails(sample).length, 100);
  delete sample[0].actors;
  assert.throws(() => validateMovieDetails(sample), /상세 정보가 올바르지/);
  sample[0].actors = ["배우 A", "배우 B"];
  sample[1].actors = ["배우 A", "배우 A"];
  assert.throws(() => validateMovieDetails(sample), /상세 정보가 올바르지/);
  sample[1].actors = [];
  assert.equal(validateMovieDetails(sample).length, 100); // TMDB 캐스팅 미등록 시 빈 배열 허용
  sample[99].budget = MIN_BUDGET_USD - 1;
  assert.throws(() => validateMovieDetails(sample), /제작비가 최소 기준에 미달/);
  sample[99].budget = 0;
  assert.throws(() => validateMovieDetails(sample), /제작비가 최소 기준에 미달/);
});

