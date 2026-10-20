import test from "node:test";
import assert from "node:assert/strict";
import {
  sortRandom,
  sortByTitle,
  sortByAmount,
  sortByAchievementRate,
  sortMovies,
} from "../src/utils/movieSort.js";

function makeMovie(movieId, title, funded, budget) {
  return {
    movieId: movieId,
    title: title,
    totalFundedAmount: funded,
    productionBudget: budget,
  };
}

function ids(movies) {
  return movies.map((movie) => movie.movieId);
}

test("랜덤: seed가 같으면 같은 순서, 다르면 다른 순서", () => {
  const movies = [];
  for (let i = 1; i <= 20; i++) {
    movies.push(makeMovie(i, "영화" + i, 0n, 100n));
  }
  assert.deepEqual(ids(sortRandom(movies, 123)), ids(sortRandom(movies, 123)));
  assert.notDeepEqual(ids(sortRandom(movies, 123)), ids(sortRandom(movies, 456)));
});

test("랜덤: 모든 영화가 빠짐없이 한 번씩 나온다", () => {
  const movies = [];
  for (let i = 1; i <= 20; i++) {
    movies.push(makeMovie(i, "영화" + i, 0n, 100n));
  }
  const sortedIds = ids(sortRandom(movies, 7)).sort((a, b) => a - b);
  assert.deepEqual(sortedIds, ids(movies));
});

test("제목 오름차순, 제목이 같으면 movieId 오름차순", () => {
  const movies = [
    makeMovie(1, "다", 0n, 100n),
    makeMovie(2, "가", 0n, 100n),
    makeMovie(3, "나", 0n, 100n),
    makeMovie(4, "가", 0n, 100n),
  ];
  assert.deepEqual(ids(sortByTitle(movies)), [2, 4, 3, 1]);
});

test("펀딩액 정렬: 동률이면 movieId 오름차순", () => {
  const movies = [
    makeMovie(1, "a", 100n, 1000n),
    makeMovie(2, "b", 300n, 1000n),
    makeMovie(3, "c", 100n, 1000n),
    makeMovie(4, "d", 0n, 1000n),
  ];
  assert.deepEqual(ids(sortByAmount(movies, "desc")), [2, 1, 3, 4]);
  assert.deepEqual(ids(sortByAmount(movies, "asc")), [4, 1, 3, 2]);
});

test("달성률 정렬: 제작비가 null/0이면 asc, desc 모두 맨 뒤", () => {
  const movies = [
    makeMovie(1, "A", 50n, 100n), 
    makeMovie(2, "B", 10n, 100n), 
    makeMovie(3, "C", 0n, null), 
    makeMovie(4, "D", 5n, 0n), 
    makeMovie(5, "E", 30n, 60n), 
  ];
  assert.deepEqual(ids(sortByAchievementRate(movies, "desc")), [1, 5, 2, 3, 4]);
  assert.deepEqual(ids(sortByAchievementRate(movies, "asc")), [2, 1, 5, 3, 4]);
});

test("정렬은 원본 배열을 바꾸지 않는다", () => {
  const movies = [
    makeMovie(2, "b", 100n, 1000n),
    makeMovie(1, "a", 300n, 1000n),
  ];
  sortByAmount(movies, "desc");
  sortByTitle(movies);
  assert.deepEqual(ids(movies), [2, 1]);
});

test("sortMovies: 조건에 맞는 정렬을 고른다", () => {
  const movies = [
    makeMovie(1, "다", 0n, 100n),
    makeMovie(2, "가", 500n, 100n),
  ];
  const byTitle = sortMovies(movies, { q: "x", sortBy: null, order: null }, 1);
  assert.deepEqual(ids(byTitle), [2, 1]);

  const byAmount = sortMovies(movies, { q: null, sortBy: "amount", order: "asc" }, 1);
  assert.deepEqual(ids(byAmount), [1, 2]);
});
