import { createError } from "../errors/createError.js";

export function notFound(req, res, next) {
  next(createError(404, "NOT_FOUND", "요청한 경로를 찾을 수 없습니다."));
}