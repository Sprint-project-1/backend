import { createError } from "../errors/createError.js";

export function validationError() {
  return createError(400, "VALIDATION_ERROR", "요청 값을 확인해 주세요.");
}

export function isPositiveIntegerString(value) {
  return typeof value === "string" && /^[1-9][0-9]*$/.test(value);
}

export function getCodePointLength(value) {
  return [...value].length;
}

export function isObjectBody(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body);
}

export function parseLimit(value, defaultsOrDefault, max) {
  const defaults = typeof defaultsOrDefault === "object"
    ? defaultsOrDefault
    : { default: defaultsOrDefault, max };
  if (value === undefined) return defaults.default;
  if (!isPositiveIntegerString(value)) throw validationError();

  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit > defaults.max) {
    throw validationError();
  }
  return limit;
}
