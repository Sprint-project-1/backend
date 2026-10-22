import { COMPARISON_COUNT, MAX_MOVIE_ID } from "../config/limits.js";
import { validationError } from "./common.js";

function isValidMovieId(movieId) {
  return Number.isInteger(movieId) && movieId > 0 && movieId <= MAX_MOVIE_ID;
}

export function parseMovieIds(body) {
  const movieIds = body?.movieIds;
  if (
    !Array.isArray(movieIds) ||
    movieIds.length < COMPARISON_COUNT.min ||
    movieIds.length > COMPARISON_COUNT.max ||
    !movieIds.every(isValidMovieId) ||
    new Set(movieIds).size !== movieIds.length
  ) {
    throw validationError();
  }
  return movieIds;
}
