import { MAX_MOVIE_ID, MOVIE_LIST_LIMIT } from "../config/limits.js";
import { isPositiveIntegerString, parseLimit, validationError } from "./common.js";

export function parseMovieId(value) {
  if (!isPositiveIntegerString(value)) throw validationError();
  const movieId = Number(value);
  if (!Number.isSafeInteger(movieId) || movieId > MAX_MOVIE_ID) {
    throw validationError();
  }
  return movieId;
}

export function parseListQuery(query) {
  const limit = parseLimit(query.limit, MOVIE_LIST_LIMIT);
  let q = null;

  if (query.q !== undefined) {
    if (typeof query.q !== "string") throw validationError();
    q = query.q.trim() || null;
  }

  let sortBy = null;
  if (query.sortBy !== undefined) {
    if (query.sortBy !== "amount" && query.sortBy !== "achievementRate") {
      throw validationError();
    }
    sortBy = query.sortBy;
  }

  let order = null;
  if (query.order !== undefined) {
    if (sortBy === null || (query.order !== "asc" && query.order !== "desc")) {
      throw validationError();
    }
    order = query.order;
  }

  if (sortBy !== null && order === null) order = "desc";
  return { limit, q, sortBy, order };
}
export { parseLimit } from "./common.js";
