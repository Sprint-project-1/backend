import test from "node:test";
import assert from "node:assert/strict";
import { parseCancelFundingBody, parseCreateFundingBody, parseUpdateFundingCommentBody } from "../src/utils/fundingValidators.js";

const validBody = {
  amount: "10000",
  nickname: " 영화팬 ",
  comment: "기대돼요",
  password: "cinefund123",
};

test("funding amount accepts positive signed BIGINT strings", () => {
  assert.equal(parseCreateFundingBody(validBody).amount, 10000n);
  assert.equal(
    parseCreateFundingBody({ ...validBody, amount: "9223372036854775807" }).amount,
    9223372036854775807n,
  );
});

test("funding amount rejects zero, non-decimal values, and BIGINT overflow", () => {
  for (const amount of ["0", "-1", "+1", "1.0", "1e3", "9223372036854775808"]) {
    assert.throws(() => parseCreateFundingBody({ ...validBody, amount }), { code: "VALIDATION_ERROR" });
  }
});

test("nickname is trimmed and measured in Unicode code points", () => {
  assert.equal(parseCreateFundingBody({ ...validBody, nickname: "  영화팬  " }).nickname, "영화팬");
  assert.equal(parseCreateFundingBody({ ...validBody, nickname: "😀😀😀😀😀😀😀😀" }).nickname.length, 16);
  assert.throws(
    () => parseCreateFundingBody({ ...validBody, nickname: "😀😀😀😀😀😀😀😀😀" }),
    { code: "VALIDATION_ERROR" },
  );
});

test("comment allows up to 100 Unicode code points", () => {
  assert.equal(parseCreateFundingBody({ ...validBody, comment: "😀".repeat(100) }).comment.length, 200);
  assert.throws(
    () => parseCreateFundingBody({ ...validBody, comment: "😀".repeat(101) }),
    { code: "VALIDATION_ERROR" },
  );
});

test("funding password requires 8 to 12 characters with letters and digits", () => {
  for (const password of ["short1a", "longpassword123", "12345678", "abcdefgh"]) {
    assert.throws(() => parseCreateFundingBody({ ...validBody, password }), { code: "VALIDATION_ERROR" });
  }
  assert.equal(parseCancelFundingBody({ password: "cinefund123" }).password, "cinefund123");
  assert.equal(
    parseUpdateFundingCommentBody({ password: "cinefund123", comment: "수정" }).comment,
    "수정",
  );
});

test("funding mutation bodies must be objects with required fields", () => {
  for (const body of [null, [], "text"]) {
    assert.throws(() => parseCreateFundingBody(body), { code: "VALIDATION_ERROR" });
    assert.throws(() => parseCancelFundingBody(body), { code: "VALIDATION_ERROR" });
  }
  assert.throws(() => parseUpdateFundingCommentBody({ password: "cinefund123" }), { code: "VALIDATION_ERROR" });
});
