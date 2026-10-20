import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMovieId,
  parseFundingId,
  parseLimit,
} from "../src/utils/validators.js";

test("parseMovieId: 올바른 값은 숫자로 바꿔 준다", () => {
  assert.equal(parseMovieId("1"), 1);
  assert.equal(parseMovieId("2147483647"), 2147483647);
});

test("parseMovieId: 잘못된 값은 400 오류를 던진다", () => {
  const badValues = ["0", "-1", "1.5", "abc", "01", " 1", "1e3", "2147483648", "", undefined];
  for (const value of badValues) {
    assert.throws(() => parseMovieId(value), {
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }
});

test("parseFundingId: BigInt로 돌려준다", () => {
  assert.equal(parseFundingId("9001"), 9001n);
  assert.equal(parseFundingId("9223372036854775807"), 9223372036854775807n);
});

test("parseFundingId: 범위를 넘거나 형식이 틀리면 400", () => {
  const badValues = ["0", "-5", "abc", "9223372036854775808"];
  for (const value of badValues) {
    assert.throws(() => parseFundingId(value), { status: 400 });
  }
});

test("parseLimit: 값이 없으면 기본값", () => {
  assert.equal(parseLimit(undefined, 20, 50), 20);
});

test("parseLimit: 정상 값과 경계값", () => {
  assert.equal(parseLimit("10", 20, 50), 10);
  assert.equal(parseLimit("50", 20, 50), 50);
});

test("parseLimit: 0, 최대 초과, 숫자 아님은 400", () => {
  const badValues = [ "0", "51", "abc", "1.5", "", ["1", "2"]];
  for (const value of badValues) {
    assert.throws(() => parseLimit(value, 20, 50), { status: 400 });
  }
});