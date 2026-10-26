import test from "node:test";
import assert from "node:assert/strict";
import { cors } from "../src/middlewares/cors.js";

// 진짜 res 대신 헤더와 상태 코드를 기록하는 가짜 res
function makeFakeRes() {
  const res = { headers: {}, statusCode: null, ended: false };
  res.setHeader = function (name, value) {
    res.headers[name.toLowerCase()] = value;
  };
  res.vary = function (name) {
    res.headers["vary"] = name;
  };
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.end = function () {
    res.ended = true;
    return res;
  };
  return res;
}

// 미들웨어를 실행하고, next가 불렸는지 함께 돌려준다.
function run(req) {
  const res = makeFakeRes();
  let nextCalled = false;
  cors(req, res, () => {
    nextCalled = true;
  });
  return { res: res, nextCalled: nextCalled };
}

test("허용된 Origin이면 Access-Control-Allow-Origin을 그 주소로 준다", () => {
  process.env.CORS_ORIGINS = "http://localhost:5173";
  const { res, nextCalled } = run({ method: "GET", headers: { origin: "http://localhost:5173" } });
  assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
  assert.equal(res.headers["vary"], "Origin");
  assert.equal(nextCalled, true);
});

test("허용되지 않은 Origin이면 허용 헤더를 주지 않는다", () => {
  process.env.CORS_ORIGINS = "http://localhost:5173";
  const { res, nextCalled } = run({ method: "GET", headers: { origin: "http://evil.example" } });
  assert.equal(res.headers["access-control-allow-origin"], undefined);
  assert.equal(nextCalled, true);
});

test("Origin 헤더가 없으면(curl 등) 허용 헤더를 주지 않고 그대로 통과한다", () => {
  process.env.CORS_ORIGINS = "http://localhost:5173";
  const { res, nextCalled } = run({ method: "GET", headers: {} });
  assert.equal(res.headers["access-control-allow-origin"], undefined);
  assert.equal(nextCalled, true);
});

test("CORS_ORIGINS가 비어 있으면 어떤 Origin도 허용하지 않는다", () => {
  process.env.CORS_ORIGINS = "";
  const { res } = run({ method: "GET", headers: { origin: "http://localhost:5173" } });
  assert.equal(res.headers["access-control-allow-origin"], undefined);
});

test("쉼표로 여러 주소를 쓸 수 있고 앞뒤 공백은 무시한다", () => {
  process.env.CORS_ORIGINS = "http://localhost:5173 , https://example.com";
  const a = run({ method: "GET", headers: { origin: "http://localhost:5173" } });
  const b = run({ method: "GET", headers: { origin: "https://example.com" } });
  assert.equal(a.res.headers["access-control-allow-origin"], "http://localhost:5173");
  assert.equal(b.res.headers["access-control-allow-origin"], "https://example.com");
});

test("허용된 Origin의 preflight는 204로 끝내고 허용 메서드·헤더를 알려 준다", () => {
  process.env.CORS_ORIGINS = "http://localhost:5173";
  const { res, nextCalled } = run({
    method: "OPTIONS",
    headers: { origin: "http://localhost:5173", "access-control-request-method": "POST" },
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
  assert.equal(nextCalled, false);
  assert.ok(res.headers["access-control-allow-methods"].includes("PATCH"));
  assert.equal(res.headers["access-control-allow-headers"], "Content-Type");
});

test("허용되지 않은 Origin의 preflight는 허용 헤더 없이 끝낸다", () => {
  process.env.CORS_ORIGINS = "http://localhost:5173";
  const { res, nextCalled } = run({
    method: "OPTIONS",
    headers: { origin: "http://evil.example", "access-control-request-method": "POST" },
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers["access-control-allow-origin"], undefined);
  assert.equal(res.headers["access-control-allow-methods"], undefined);
  assert.equal(nextCalled, false);
});
