import { createHash } from "node:crypto";

function compareBigInt(a, b) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function compareById(a, b) {
  return a.movieId - b.movieId;
}

export function sortRandom(movies, seed) {
  const withKey = movies.map((movie) => {
    const key = createHash("sha256")
      .update(`${seed}-${movie.movieId}`)
      .digest("hex");
    return { movie: movie, key: key };
  });

  withKey.sort((a, b) => {
    if (a.key < b.key) {
      return -1;
    }
    if (a.key > b.key) {
      return 1;
    }
    return compareById(a.movie, b.movie);
  });

  return withKey.map((item) => item.movie);
}

export function sortByTitle(movies) {
  return [...movies].sort((a, b) => {
    const result = a.title.localeCompare(b.title, "ko");
    if (result !== 0) {
      return result;
    }
    return compareById(a, b);
  });
}

export function compareByAmount(a, b, order) {
  let result = compareBigInt(a.totalFundedAmount, b.totalFundedAmount);
  if (order === "desc") {
    result = -result;
  }
  if (result !== 0) {
    return result;
  }
  return compareById(a, b);
}

export function sortByAmount(movies, order) {
  return [...movies].sort((a, b) => compareByAmount(a, b, order));
}

function hasRate(movie) {
  return movie.productionBudget !== null && movie.productionBudget > 0n;
}

export function compareByAchievementRate(a, b, order) {
  const aHasRate = hasRate(a);
  const bHasRate = hasRate(b);

  if (aHasRate && !bHasRate) {
    return -1;
  }
  if (!aHasRate && bHasRate) {
    return 1;
  }

  if (!aHasRate && !bHasRate) {
    return compareById(a, b);
  }

  const left = a.totalFundedAmount * b.productionBudget;
  const right = b.totalFundedAmount * a.productionBudget;
  let result = compareBigInt(left, right);
  if (order === "desc") {
    result = -result;
  }
  if (result !== 0) {
    return result;
  }
  return compareById(a, b);
}

export function sortByAchievementRate(movies, order) {
  return [...movies].sort((a, b) => compareByAchievementRate(a, b, order));
}
export function sortMovies(movies, params, seed) {
  if (params.sortBy === "amount") {
    return sortByAmount(movies, params.order);
  }
  if (params.sortBy === "achievementRate") {
    return sortByAchievementRate(movies, params.order);
  }
  if (params.q !== null) {
    return sortByTitle(movies);
  }
  return sortRandom(movies, seed);
}
