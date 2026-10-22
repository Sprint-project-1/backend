import { fundingRepository } from "../repositories/fundingRepository.js";
import { ensureMovieExists } from "./movieService.js";
import { toCommentResponse } from "../utils/commentResponse.js";
import {
  encodeCommentCursor,
  decodeCommentCursor,
} from "../utils/commentCursor.js";

export async function listComments(movieId, limit, cursorText) {
  const cursor = cursorText === undefined
    ? null
    : decodeCommentCursor(cursorText, movieId);
  await ensureMovieExists(movieId);
  const rows = await fundingRepository.listByMovie(movieId, limit, cursor);

  const hasMore = rows.length > limit;
  const fundings = hasMore ? rows.slice(0, limit) : rows;
  const lastFunding = fundings.at(-1);

  return {
    items: fundings.map(toCommentResponse),
    page: {
      nextCursor: hasMore ? encodeCommentCursor(movieId, lastFunding) : null,
      hasMore,
    },
  };
}
