// DB에 연결할 수 없거나 연결이 끊겼을 때 Prisma가 던지는 오류 코드
// P1000: 인증 실패, P1001: DB 서버에 닿을 수 없음, P1017: 서버가 연결을 끊음
const DB_UNAVAILABLE_CODES = ["P1000", "P1001", "P1017"];

export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "요청 값을 확인해 주세요."},
    });
  }

  if (err.isMyError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

    // DB를 사용할 수 없는 경우: 원인은 서버 로그에만 남기고 사용자에게는 일반 메시지만 준다.
  if (DB_UNAVAILABLE_CODES.includes(err.code)) {
    console.error(err);
    return res.status(503).json({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다."},
  });
}