import { prisma } from "../config/db.js";
import { createError } from "../errors/createError.js";
import { toMovieResponse } from "../utils/movieResponse.js";

export async function getMovieById(movieId) {
  const movie = await prisma.movie.findUnique({
    where: { movieId: movieId },
  });

  if (movie === null) {
    throw createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
  }

  return toMovieResponse(movie);
}