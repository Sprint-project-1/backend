import { prisma } from "../config/db.js";
import { toMovieResponse } from "../utils/movieResponse.js";
import { buildRankingPage } from "../utils/rankingPage.js";

export async function listRankings(params, cursorText) {
  const movies = await prisma.movie.findMany(); // DB에서 최신 영화 데이터 조회

  const result = buildRankingPage(
    movies, // 조회한 영화 전체
    params, // 정렬 및 개수 조건
    cursorText, // 이전에 본 영화 정보가 담긴 커서
  );

  return {
    items: result.items.map(toMovieResponse), // 기존 영화 응답 형식 재사용
    page: result.page, // nextCursor와 hasMore 반환
  };
}