import { createError } from "../errors/createError.js";

export function arrangeByIds(foundMovies, movieIds) {
  const orderedMovies = [];

  for (let i = 0; i < movieIds.length; i++) {
    const id = movieIds[i];
    const movie = foundMovies.find((m) => m.movieId === id);

    if (movie === undefined) {
      throw createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
    }

    orderedMovies.push(movie);
  }

  return orderedMovies;
}