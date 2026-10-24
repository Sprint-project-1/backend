import { prisma } from "../config/db.js";
import { getMovieById } from "./movieService.js";
import { toCommentResponse } from "../utils/commentResponse.js";
import {
  encodeCommentCursor,
  decodeCommentCursor,
} from "../utils/commentCursor.js";

export async function listComments(movieId, limit, cursorText) {
  let where = { movieId: movieId };

  if (cursorText !== undefined) {
    const position = decodeCommentCursor(cursorText, movieId);

    where = {
      movieId: movieId,
      OR: [
        { createdAt: { lt: position.createdAt } },
        { createdAt: position.createdAt, fundingId: { lt: position.fundingId } },
      ],
    };
  }

  await getMovieById(movieId);

  const rows = await prisma.funding.findMany({
    where: where,
    orderBy: [{ createdAt: "desc" }, { fundingId: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;

  let fundings = rows;
  if (hasMore) {
    fundings = rows.slice(0, limit);
  }

  let nextCursor = null;
  if (hasMore) {
    const lastFunding = fundings[fundings.length - 1];
    nextCursor = encodeCommentCursor(movieId, lastFunding);
  }

  const items = fundings.map((funding) => toCommentResponse(funding));

  return {
    items: items,
    page: { nextCursor: nextCursor, hasMore: hasMore },
  };
}
