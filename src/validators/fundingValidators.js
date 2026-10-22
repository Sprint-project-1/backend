import {
  COMMENT_MAX_LENGTH,
  FUNDING_NICKNAME_MAX_LENGTH,
  MAX_FUNDING_AMOUNT,
  MAX_FUNDING_ID,
  PASSWORD_LENGTH,
} from "../config/limits.js";
import {
  getCodePointLength,
  isObjectBody,
  isPositiveIntegerString,
  validationError,
} from "./common.js";

function hasValidPasswordFormat(value) {
  if (typeof value !== "string") return false;
  const length = getCodePointLength(value);
  return (
    length >= PASSWORD_LENGTH.min &&
    length <= PASSWORD_LENGTH.max &&
    /[A-Za-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

export function parseFundingId(value) {
  if (!isPositiveIntegerString(value)) throw validationError();
  const fundingId = BigInt(value);
  if (fundingId > MAX_FUNDING_ID) throw validationError();
  return fundingId;
}

export function parseFundingInput(body) {
  if (!isObjectBody(body)) throw validationError();

  const { amount, nickname, comment, password } = body;
  if (
    typeof amount !== "string" ||
    !/^[0-9]+$/.test(amount) ||
    typeof nickname !== "string" ||
    typeof comment !== "string" ||
    !hasValidPasswordFormat(password)
  ) {
    throw validationError();
  }

  const parsedAmount = BigInt(amount);
  const normalizedNickname = nickname.trim();
  if (
    parsedAmount < 1n ||
    parsedAmount > MAX_FUNDING_AMOUNT ||
    getCodePointLength(normalizedNickname) < 1 ||
    getCodePointLength(normalizedNickname) > FUNDING_NICKNAME_MAX_LENGTH ||
    getCodePointLength(comment) > COMMENT_MAX_LENGTH
  ) {
    throw validationError();
  }

  return { amount: parsedAmount, nickname: normalizedNickname, comment, password };
}

export function parseFundingPassword(body) {
  if (!isObjectBody(body) || !hasValidPasswordFormat(body.password)) {
    throw validationError();
  }
  return body.password;
}

export function parseFundingComment(body) {
  if (
    !isObjectBody(body) ||
    !hasValidPasswordFormat(body.password) ||
    typeof body.comment !== "string" ||
    getCodePointLength(body.comment) > COMMENT_MAX_LENGTH
  ) {
    throw validationError();
  }
  return { password: body.password, comment: body.comment };
}
