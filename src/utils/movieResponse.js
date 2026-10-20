export function toMovieResponse(movie) {
  let releaseDate = null;
  if (movie.releaseDate !== null) {
    releaseDate = movie.releaseDate.toISOString().slice(0, 10);
  }

  let productionBudget = null;
  if (movie.productionBudget !== null) {
    productionBudget = movie.productionBudget.toString();
  }

  return {
    movieId: movie.movieId,
    tmdbId: movie.tmdbId,
    title: movie.title,
    originalTitle: movie.originalTitle,
    koreanCertification: movie.koreanCertification,
    posterPath: movie.posterPath,
    overview: movie.overview,
    director: movie.director,
    actors: movie.actors,
    releaseDate: releaseDate,
    genres: movie.genres,
    tagline: movie.tagline,
    productionBudget: productionBudget,
    totalFundedAmount: movie.totalFundedAmount.toString(),
  };
}