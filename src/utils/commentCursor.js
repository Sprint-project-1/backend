import { createError } from "../errors/createError.js";
import { parseFundingId } from "../validators/fundingValidators.js";

function invalidCursor() {
  return createError(400, "VALIDATION_ERROR", "요청 값을 확인해 주세요.");
}

export function encodeCommentCursor(movieId, lastFunding) {
  const data = {
    movieId: movieId,
    createdAt: lastFunding.createdAt.toISOString(),
    fundingId: lastFunding.fundingId.toString(),
  };
  const json = JSON.stringify(data);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCommentCursor(text, movieId) {
  if (typeof text !== "string") {
    throw invalidCursor();
  }

  let data;
  try {
    const json = Buffer.from(text, "base64url").toString("utf8");
    data = JSON.parse(json);
  } catch (error) {
    throw invalidCursor();
  }

  if (typeof data !== "object" || data === null) {
    throw invalidCursor();
  }

  if (data.movieId !== movieId) {
    throw invalidCursor();
  }

  if (typeof data.createdAt !== "string") {
    throw invalidCursor();
  }
  const createdAt = new Date(data.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    throw invalidCursor();
  }
  if (createdAt.toISOString() !== data.createdAt) {
    throw invalidCursor();
  }

  const fundingId = parseFundingId(data.fundingId);

  return { createdAt: createdAt, fundingId: fundingId };
}
