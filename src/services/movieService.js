import { createError } from "../errors/createError.js";
import { movieRepository } from "../repositories/movieRepository.js";
import { fundingRepository } from "../repositories/fundingRepository.js";
import { toMovieResponse } from "../utils/movieResponse.js";
import { buildListPage } from "../utils/moviePage.js";

async function attachFundingTotals(movies) {
  const totals = await fundingRepository.totalsByMovieIds(
    movies.map((movie) => movie.movieId),
  );

  return movies.map((movie) => ({
    ...movie,
    totalFundedAmount: totals.get(movie.movieId) ?? 0n,
  }));
}

async function findMovieOrThrow(movieId) {
  const movie = await movieRepository.findById(movieId);
  if (movie === null) {
    throw createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
  }
  return movie;
}

export async function getMovieById(movieId) {
  const movie = await findMovieOrThrow(movieId);
  const [movieWithFundingTotal] = await attachFundingTotals([movie]);
  return toMovieResponse(movieWithFundingTotal);
}

export async function ensureMovieExists(movieId) {
  await findMovieOrThrow(movieId);
}

export async function listMovies(params, cursorText) {
  const allMovies = await attachFundingTotals(await movieRepository.findAll());
  const movies = params.q === null
    ? allMovies
    : allMovies.filter((movie) =>
        movie.title.toLowerCase().includes(params.q.toLowerCase()),
      );

  const page = buildListPage(movies, params, cursorText);
  return {
    items: page.items.map(toMovieResponse),
    page: page.page,
  };
}

export async function getMoviesForComparison(movieIds) {
  const movies = await movieRepository.findByIds(movieIds);
  if (movies.length !== movieIds.length) {
    throw createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
  }

  const moviesById = new Map(movies.map((movie) => [movie.movieId, movie]));
  const orderedMovies = movieIds.map((movieId) => moviesById.get(movieId));
  const withTotals = await attachFundingTotals(orderedMovies);
  return { items: withTotals.map(toMovieResponse) };
}
