import { readFile } from "node:fs/promises";

export const MOVIE_COUNT = 100;
// TMDB 제작비 원본은 USD, 후원액과 누적 후원액은 KRW입니다.
// 고정 환율은 영화 선정의 최소 제작비(3,500만 원 상당) 검증에만 사용합니다.
export const USD_KRW_RATE = 1400;
export const MIN_BUDGET_KRW = 35_000_000;
export const MIN_BUDGET_USD = Math.ceil(MIN_BUDGET_KRW / USD_KRW_RATE);
export const meetsMinimumBudget = (budget) =>
  Number.isSafeInteger(budget) && budget >= MIN_BUDGET_USD;

export const moviePath = (id) => `/movie/${id}`;
export const isValidPostgresIntId = (id) => Number.isInteger(id) && id > 0 && id <= 2147483647;

// TMDB /movie/:id?append_to_response=credits 의 출연 배우 최대 10명 추출
export function actorsFromCredits(credits) {
  const names = (credits?.cast ?? [])
    .filter((person) => typeof person?.name === "string" && person.name.trim())
    .map((person) => person.name.trim());
  return [...new Set(names)].slice(0, 10);
}

// TMDB /movie/:id?append_to_response=credits 의 감독 정보 추출
export function directorsFromCredits(credits) {
  const names = (credits?.crew ?? [])
    .filter((person) => person?.job === "Director" && typeof person.name === "string" && person.name.trim())
    .map((person) => person.name.trim());
  return [...new Set(names)].join(", ") || null;
}

export function isValidMovieIds(ids) {
  return Array.isArray(ids)
    && ids.length === MOVIE_COUNT
    && ids.every(isValidPostgresIntId)
    && new Set(ids).size === MOVIE_COUNT;
}

// 영화 선정 당시의 JSON을 시드·DB 검사에 사용하기 전에 조건을 다시 확인합니다.
export function validateMovieDetails(details) {
  if (!Array.isArray(details) || !isValidMovieIds(details.map((movie) => movie?.tmdbId))) {
    throw new Error("data/movieDetails.json에는 고유한 영화 ID 100개가 있어야 합니다.");
  }
  for (const movie of details) {
    if (typeof movie.title !== "string" || !movie.title.trim()
      || !Object.hasOwn(movie, "director")
      || !(movie.director === null || typeof movie.director === "string")
      || !Array.isArray(movie.genres) || !movie.genres.every((genre) => typeof genre === "string")
      || !Object.hasOwn(movie, "actors")
      || !Array.isArray(movie.actors)
      || movie.actors.length > 10
      || !movie.actors.every((actor) => typeof actor === "string" && actor.trim().length > 0)
      || new Set(movie.actors).size !== movie.actors.length
      || typeof movie.overview !== "string"
      || !(movie.posterPath === null || typeof movie.posterPath === "string")) {
      throw new Error(`영화 ${movie.tmdbId}의 상세 정보가 올바르지 않습니다. JSON을 확인하세요.`);
    }
    if (!meetsMinimumBudget(movie.budget)) {
      throw new Error(`영화 ${movie.tmdbId}의 제작비가 최소 기준에 미달합니다. `
        + `TMDB 제작비 ${MIN_BUDGET_USD} USD 이상(1 USD = ${USD_KRW_RATE} KRW 기준)이 필요합니다.`);
    }
  }
  return details;
}

// 선정된 영화 100편의 상세 정보를 읽습니다. 파일이 없으면 새로 선정해야 합니다.
export async function readMovieDetails() {
  let details;
  try {
    details = JSON.parse(await readFile(new URL("../../data/movieDetails.json", import.meta.url), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("data/movieDetails.json이 없습니다. 최초 1회 pnpm movies:select를 실행하세요.");
    }
    throw error;
  }
  return validateMovieDetails(details);
}

// Accept known non-adult Korean movie ratings; reject unknown/19+.
export function koreanMovieRating(releaseDates) {
  const kr = releaseDates?.results?.find((row) => row.iso_3166_1 === "KR");
  const ratings = (kr?.release_dates ?? [])
    .map((row) => String(row.certification ?? "").trim())
    .filter(Boolean);
  if (ratings.length === 0) return null;
  if (ratings.some((rating) => /19|18|청소년|제한상영|adult/i.test(rating))) return null;
  const allowed = ratings.find((rating) => /^(전체|전체 관람가|all|g|0|12|12세 이상 관람가|15|15세 이상 관람가)$/i.test(rating));
  return allowed ?? null;
}

export function koreanToday() {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}
