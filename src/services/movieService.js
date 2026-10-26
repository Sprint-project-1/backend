import { prisma } from "../config/db.js";
import { createError } from "../errors/createError.js";
import { toMovieResponse } from "../utils/movieResponse.js";
import { buildListPage } from "../utils/moviePage.js";

export async function getMovieById(movieId) {
  const movie = await prisma.movie.findUnique({
    where: { movieId: movieId },
  });

  if (movie === null) {
    throw createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
  }

  return toMovieResponse(movie);
}

export async function listMovies(params, cursorText) {
  const allMovies = await prisma.movie.findMany();

  let movies = allMovies;
  if (params.q !== null) {
    const keyword = params.q.toLowerCase();
    movies = allMovies.filter((movie) =>
      movie.title.toLowerCase().includes(keyword),
    );
  }

  const result = buildListPage(movies, params, cursorText);
  const items = result.items.map((movie) => toMovieResponse(movie));

  return { items, page: result.page };
}

export async function getMoviesForComparison(movieIds) {
  const foundMovies = await prisma.movie.findMany({
    where: { movieId: { in: movieIds } },
  });

  if (foundMovies.length !== movieIds.length) {
    throw createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
  }

  const moviesById = new Map(foundMovies.map((movie) => [movie.movieId, movie]));
  const orderedMovies = movieIds.map((movieId) => moviesById.get(movieId));

  const items = orderedMovies.map((movie) => toMovieResponse(movie));
  return { items };
}
