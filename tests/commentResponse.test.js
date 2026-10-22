import test from "node:test";
import assert from "node:assert/strict";
import { toCommentResponse } from "../src/utils/commentResponse.js";

function makeFunding() {
  return {
    fundingId: 9001n,
    movieId: 1,
    nickname: "영화팬",
    amount: 10000n,
    comment: "기대돼요",
    passwordHash: "secret-hash",
    createdAt: new Date("2026-10-19T03:00:00.000Z"),
    updatedAt: new Date("2026-10-19T04:00:00.000Z"),  
  };
}

test("toCommentResponse: fundingId and amount become strings", () => {
  const result = toCommentResponse(makeFunding());
  assert.equal(result.fundingId, "9001");
  assert.equal(result.amount, "10000");
});

test("toCommentResponse: movieId stays a number", () => {
  const result = toCommentResponse(makeFunding());
  assert.equal(result.movieId, 1);
});

test("toCommentResponse: nickname and comment are copied as they are", () => {
  const result = toCommentResponse(makeFunding());
  assert.equal(result.nickname, "영화팬");
  assert.equal(result.comment, "기대돼요");
});

test("toCommentResponse: createdAt becomes an ISO string", () => {
  const result = toCommentResponse(makeFunding());
  assert.equal(result.createdAt, "2026-10-19T03:00:00.000Z");
});

test("toCommentResponse: passwordHash and updatedAt are not exposed", () => {
  const result = toCommentResponse(makeFunding());
  assert.equal(result.passwordHash, undefined);
  assert.equal(result.updatedAt, undefined);
});

test("toCommentResponse: has exactly 6 fields", () => {
  const result = toCommentResponse(makeFunding());
  assert.equal(Object.keys(result).length, 6);
});