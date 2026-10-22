import { sortMovies } from "./movieSort.js";
import { encodeRankingCursor, decodeRankingCursor } from "./rankingCursor.js";

export function buildRankingPage(movies, params, cursorText) {
  // 첫 요청이면 아직 본 영화가 없음
  const seenIds =
    cursorText === undefined ? [] : decodeRankingCursor(cursorText, params);

  // 이미 본 영화 ID를 Set으로 변환
  const seen = new Set(seenIds);

  // 현재 펀딩 금액을 기준으로 정렬
  const sorted = sortMovies(movies, { ...params, q: null }, null);

  // 이전에 본 영화를 제외
  const remaining = sorted.filter((movie) => !seen.has(movie.movieId));

  // 아직 안 본 영화 중 10개 가져오기
  const items = remaining.slice(0, params.limit);

  // 다음 페이지가 존재하는지 확인
  const hasMore = remaining.length > params.limit;

  // 이미 본 영화 ID를 누적해서 다음 커서 생성
  const nextCursor = hasMore
    ? encodeRankingCursor(
        [...seenIds, ...items.map((movie) => movie.movieId)],
        params,
      )
    : null;

  return {
    items,
    page: {
      nextCursor,
      hasMore,
    },
  };
}
