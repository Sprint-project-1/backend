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

  console.error(err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다."},
  });
}