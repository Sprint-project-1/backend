import { access, mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { tmdbGet } from "./tmdb.js";
import { actorsFromCredits, directorsFromCredits, isValidPostgresIntId, koreanMovieRating, koreanToday, isValidMovieIds, meetsMinimumBudget, MIN_BUDGET_KRW, MIN_BUDGET_USD, USD_KRW_RATE, validateMovieDetails, MOVIE_COUNT, moviePath } from "./movieData.js";

const detailsFile = new URL("../../data/movieDetails.json", import.meta.url);

async function exists(url) {
  try { await access(url); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

function toSnapshot(movie, rating) {
  return {
    tmdbId: movie.id,
    title: movie.title,
    director: directorsFromCredits(movie.credits), // TMDB 감독 (없으면 null)
    actors: actorsFromCredits(movie.credits), // TMDB 출연 배우 최대 10명
    originalTitle: movie.original_title,
    overview: movie.overview,
    releaseDate: movie.release_date,
    genres: (movie.genres ?? []).map((genre) => genre.name),
    tagline: movie.tagline,
    budget: movie.budget, // TMDB 제작비(USD). 누적 후원(KRW)은 DB에서 별도 관리
    posterPath: movie.poster_path,
    koreanCertification: rating,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--refresh")) {
    throw new Error("사용법: pnpm movies:select [--refresh]");
  }
  const refresh = args.includes("--refresh");
  // 기본 실행은 기존 100편을 보호합니다. 명시적 --refresh에서만 교체를 허용합니다.
  if (!refresh && await exists(detailsFile)) {
    throw new Error("이미 영화 JSON이 있습니다. 100편을 재선정하려면 --refresh를 사용하세요.");
  }

  console.log(`제작비 최소 ${MIN_BUDGET_KRW.toLocaleString("ko-KR")}원 `
    + `(고정 환율 1 USD = ${USD_KRW_RATE.toLocaleString("ko-KR")}원, TMDB 제작비 ${MIN_BUDGET_USD.toLocaleString("en-US")} USD 이상)`);

  const today = koreanToday();
  const details = [];
  const seen = new Set();
  let page = 1;
  let totalPages = 500;

  while (details.length < MOVIE_COUNT && page <= Math.min(totalPages, 500)) {
    const discovered = await tmdbGet("/discover/movie", {
      sort_by: "popularity.desc",
      include_adult: "false",
      "primary_release_date.lte": today,
      language: "ko-KR",
      page,
    });
    totalPages = Math.min(500, Number(discovered.total_pages) || 0);
    const candidates = (discovered.results ?? []).filter(
      (movie) => isValidPostgresIntId(movie.id)
        && !movie.adult
        && !!movie.release_date
        && movie.release_date <= today
        && !seen.has(movie.id)
    );

    // Process batches in source popularity order; limit parallel TMDB calls.
    for (let i = 0; i < candidates.length && details.length < MOVIE_COUNT; i += 4) {
      const batch = candidates.slice(i, i + 4);
      const fetched = await Promise.all(batch.map((movie) =>
        tmdbGet(moviePath(movie.id), { language: "ko-KR", append_to_response: "release_dates,credits" })
      ));
      for (const movie of fetched) {
        if (details.length === MOVIE_COUNT) break;
        if (seen.has(movie.id)) continue;
        seen.add(movie.id);
        if (movie.adult || !movie.release_date || movie.release_date > today) continue;
        if (!meetsMinimumBudget(movie.budget)) continue; // 예산 0원·미상·3,500만 원 미만 제외
        const rating = koreanMovieRating(movie.release_dates);
        if (!rating) continue;
        details.push(toSnapshot(movie, rating));
      }
    }
    console.log(`TMDB 인기순 ${page}페이지 확인 / 선정 ${details.length}/${MOVIE_COUNT}`);
    page++;
  }

  const ids = details.map((movie) => movie.tmdbId);
  if (!isValidMovieIds(ids)) {
    throw new Error(`100편 선정 실패 (${details.length}편). 파일을 저장하지 않았습니다.`);
  }

  // JSON이 생성되기 전에 공통 시드 검증을 통과해야 합니다.
  validateMovieDetails(details);

  await mkdir(new URL("../../data/", import.meta.url), { recursive: true });
  const detailsTemp = new URL("../../data/.movieDetails.tmp", import.meta.url);
  try {
    await writeFile(detailsTemp, `${JSON.stringify(details, null, 2)}\n`, { flag: "wx" });
    // API 요청/검증이 모두 성공한 뒤에만 교체합니다. 실패하면 기존 JSON을 그대로 둡니다.
    if (!refresh && await exists(detailsFile)) {
      throw new Error("다른 작업이 이미 영화 100편 데이터를 생성했습니다.");
    }
    await rename(detailsTemp, detailsFile);
  } finally {
    await unlink(detailsTemp).catch((error) => { if (error.code !== "ENOENT") throw error; });
  }
  console.log(`영화 ${details.length}편 ${refresh ? "재선정" : "선정"} 완료(배우 포함): data/movieDetails.json`);
  console.log("이 파일 하나만 팀 Git 저장소에 커밋하여 모두가 같은 100편을 사용하세요.");
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
