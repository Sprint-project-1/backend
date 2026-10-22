import test from "node:test";
import assert from "node:assert/strict";
import { arrangeByIds } from "../src/utils/comparison.js";

const foundMovies = [{movieId: 1 }, { movieId: 2 }, {movieId: 3 }];

function getIds(movies) {
  return movies.map((movie) => movie.movieId);
}

test("arrangeByIds: 요청한 ID 순서대로 돌려준다", () => {
  const result = arrangeByIds(foundMovies, [3, 1, 2]);
  assert.deepEqual(getIds(result), [3, 1, 2]);
});

test("arrangeByIds: DB가 준 순서와 상관없이 요청 순서를 따른다", () => {
  const reversed = [{ movieId: 3 }, { movieId: 2}, {movieId: 1 }];
  const result = arrangeByIds(reversed, [1, 2, 3]);
  assert.deepEqual(getIds(result), [1, 2, 3]);
});

test("arrangeByIds: 요청한 개수만큼만 돌려준다", () => {
  const result = arrangeByIds(foundMovies, [2, 3]);
  assert.equal(result.length, 2);
  assert.deepEqual(getIds(result), [2, 3]);
});

test("arrangeByIds: 하나라도 없으면 404 MOVIE_NOT_FOUND", () => {
  assert.throws(() => arrangeByIds(foundMovies, [1, 99]), {
    status: 404,
    code: "MOVIE_NOT_FOUND",
  });
});

test("arrangeByIds: 전부 없어도 404", () => {
  assert.throws(() => arrangeByIds(foundMovies, [98, 99]), {
    status: 404,
    code: "MOVIE_NOT_FOUND",
  });
});