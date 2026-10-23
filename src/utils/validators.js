import { createError } from "../errors/createError.js";

const MAX_INT = 2147483647; 
const MAX_BIGINT = 9223372036854775807n;

function validationError() {
  return createError(400, "VALIDATION_ERROR", "요청 값을 확인해 주세요.");

}

function isPositiveIntegerString(value) {
  if (typeof value !== "string") {
    return false;
  }
  return /^[1-9][0-9]*$/.test(value);
}

export function parseMovieId(value) {
  if (!isPositiveIntegerString(value)) {
    throw validationError();
  }
  const id = Number(value);
  if (id > MAX_INT) {
    throw validationError();

  }
  return id;
}

export function parseFundingId(value) {
  if (!isPositiveIntegerString(value)) {
    throw validationError();
  }
  const id = BigInt(value);
  if (id > MAX_BIGINT) {
    throw validationError();
  }
  return id;
}

export function parseLimit(value, defaultLimit, maxLimit) {
  if (value === undefined) {
    return defaultLimit;
  }
  if (!isPositiveIntegerString(value)) {
    throw validationError();
  }
  const limit = Number(value);
  if (limit > maxLimit) {
    throw validationError();
  }
  return limit;
}

export function parseListQuery(query) {
  const limit = parseLimit(query.limit, 20, 50);

  let q = null;
  if (query.q !== undefined) {
    if (typeof query.q !== "string") {
      throw validationError();
    }
    const trimmed = query.q.trim();
    if (trimmed !== "") {
      q = trimmed;
    }
  }

  let sortBy = null;
  if (query.sortBy !== undefined) {
    if (query.sortBy !== "amount" && query.sortBy !== "achievementRate") {
      throw validationError();
    }
    sortBy = query.sortBy;
  }

  let order = null;
  if (query.order !== undefined) {
    if (sortBy === null) {
      throw validationError();
    }
    if (query.order !== "asc" && query.order !== "desc") {
      throw validationError();
    }
    order = query.order;
  }

  if (sortBy !== null && order === null) {
    order = "desc";
  }

  return { limit, q, sortBy, order };
}
