import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeCommentCursor,
  decodeCommentCursor,
} from "../src/utils/commentCursor.js";

function expect400(action) {
  assert.throws(action, (error) => {
    return error.status === 400 && error.code === "VALIDATION_ERROR";
  });
}

function makeCursorText(data) {
  const json = JSON.stringify(data);
  return Buffer.from(json, "utf8").toString("base64url");
}

function makeLastFunding() {
  return {
    fundingId: 9001n,
    createdAt: new Date("2026-10-19T03:00:00.000Z"),
  };
}

test("comment cursor: 만든 cursor를 풀면 같은 위치가 나온다", () => {
  const text = encodeCommentCursor(1, makeLastFunding());
  const position = decodeCommentCursor(text, 1);
  assert.equal(position.createdAt.getTime(), new Date("2026-10-19T03:00:00.000Z").getTime());
  assert.equal(position.fundingId, 9001n);
});

test("comment cursor: 문자열이 아니면 400", () => {
  expect400(() => decodeCommentCursor(undefined, 1));
  expect400(() => decodeCommentCursor(123, 1));
  expect400(() => decodeCommentCursor(["a", "b"], 1));
});

test("comment cursor: 깨진 문자열이나 JSON이 아니면 400", () => {
  expect400(() => decodeCommentCursor("", 1));
  expect400(() => decodeCommentCursor("!!!", 1));
  expect400(() => decodeCommentCursor(makeCursorText("hello"), 1));
  expect400(() => decodeCommentCursor(makeCursorText(null), 1));
  expect400(() => decodeCommentCursor(makeCursorText(123), 1));
});

test("comment cursor: 다른 영화에서 받은 cursor는 400", () => {
  const text = encodeCommentCursor(1, makeLastFunding());
  expect400(() => decodeCommentCursor(text, 2));
});

test("comment cursor: createdAt이 올바르지 않으면 400", () => {
  const base = {movieId: 1, fundingId: "9001" };
  expect400(() => decodeCommentCursor(makeCursorText({ ...base, createdAt: "abc"}), 1));
  expect400(() => decodeCommentCursor(makeCursorText({ ...base, createdAt: 123 }), 1));
  expect400(() => decodeCommentCursor(makeCursorText({ ...base, createdAt: "2026-10-19" }), 1));
});

test("comment cursor: fundingId가 올바르지 않으면 400", () => {
  const base = { movieId: 1, createdAt: "2026-10-19T03:00:00.000Z" };
  expect400(() => decodeCommentCursor(makeCursorText({ ...base, fundingId: "0" }), 1));
  expect400(() => decodeCommentCursor(makeCursorText({ ...base, fundingId: "9223372036854775808"}), 1));
});