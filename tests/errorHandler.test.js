import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middlewares/errorHandler.js";

// 이 파일의 테스트에서는 오류 로그를 화면에 출력하지 않는다.
console.error = () => {};

// 진짜 res 대신 상태 코드와 본문을 기록하는 가짜 res
function makeFakeRes() {
  const res = { statusCode: null, body: null };
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (body) {
    res.body = body;
    return res;
  };
  return res;
}

test("DB에 연결할 수 없는 Prisma 오류는 503 SERVICE_UNAVAILABLE", () => {
  for (const code of ["P1000", "P1001", "P1017"]) {
    const err = new Error("Can't reach database server at 127.0.0.1:5435");
    err.code = code;
    const res = makeFakeRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error.code, "SERVICE_UNAVAILABLE");
  }
});

test("503 응답에는 DB 주소 같은 내부 정보가 없다", () => {
  const err = new Error("Can't reach database server at 127.0.0.1:5435");
  err.code = "P1001";
  const res = makeFakeRes();
  errorHandler(err, {}, res, () => {});
  const text = JSON.stringify(res.body);
  assert.equal(text.includes("127.0.0.1"), false);
  assert.equal(text.includes("5435"), false);
  assert.equal(text.includes("P1001"), false);
});

test("우리가 만든 오류는 그 상태 코드와 이름 그대로 응답한다", () => {
  const err = new Error("영화를 찾을 수 없습니다.");
  err.isMyError = true;
  err.status = 404;
  err.code = "MOVIE_NOT_FOUND";
  const res = makeFakeRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, "MOVIE_NOT_FOUND");
});

test("알 수 없는 오류는 500이고 원문을 응답에 넣지 않는다", () => {
  const res = makeFakeRes();
  errorHandler(new Error("비밀 내부 정보"), {}, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error.code, "INTERNAL_ERROR");
  assert.equal(JSON.stringify(res.body).includes("비밀"), false);
});

test("DB 오류가 아닌 다른 코드(P2002 등)는 503이 아니라 500", () => {
  const err = new Error("Unique constraint failed");
  err.code = "P2002";
  const res = makeFakeRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 500);
});

test("깨진 JSON 본문은 400", () => {
  const err = new Error("bad json");
  err.type = "entity.parse.failed";
  const res = makeFakeRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("JSON 본문 크기 초과는 413 PAYLOAD_TOO_LARGE", () => {
  const err = new Error("request entity too large");
  err.type = "entity.too.large";
  const res = makeFakeRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 413);
  assert.equal(res.body.error.code, "PAYLOAD_TOO_LARGE");
  assert.equal(
    res.body.error.message,
    "요청 본문이 허용된 크기를 초과했습니다.",
  );
});

test("잘못된 URL 인코딩은 400 VALIDATION_ERROR", () => {
  const err = new URIError("URI malformed");
  err.status = 400;
  const res = makeFakeRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("지원하지 않는 JSON 문자셋·압축 방식은 415", () => {
  for (const type of ["charset.unsupported", "encoding.unsupported"]) {
    const err = new Error("unsupported request encoding");
    err.type = type;
    const res = makeFakeRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res.statusCode, 415);
    assert.equal(res.body.error.code, "UNSUPPORTED_MEDIA_TYPE");
  }
});
