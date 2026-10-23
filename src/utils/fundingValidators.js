import { createError } from "../errors/createError.js";

const MAX_BIGINT = 9223372036854775807n;

function invalidInput() {
  return createError(400, "VALIDATION_ERROR", "요청 값을 확인해 주세요.");
}

function requireObject(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw invalidInput();
  }
}

function parsePassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 12
      || !/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw invalidInput();
  }
  return value;
}

function parseComment(value) {
  if (typeof value !== "string" || Array.from(value).length > 100) {
    throw invalidInput();
  }
  return value;
}

export function parseCreateFundingBody(body) {
  requireObject(body);
  const { amount, nickname, comment, password } = body;
  if (typeof amount !== "string" || !/^[1-9][0-9]*$/.test(amount)) {
    throw invalidInput();
  }
  let amountValue;
  try {
    amountValue = BigInt(amount);
  } catch {
    throw invalidInput();
  }
  if (amountValue > MAX_BIGINT) throw invalidInput();
  if (typeof nickname !== "string") throw invalidInput();
  const normalizedNickname = nickname.trim();
  const nicknameLength = Array.from(normalizedNickname).length;
  if (nicknameLength < 1 || nicknameLength > 8) throw invalidInput();

  return {
    amount: amountValue,
    nickname: normalizedNickname,
    comment: parseComment(comment),
    password: parsePassword(password),
  };
}

export function parseCancelFundingBody(body) {
  requireObject(body);
  return { password: parsePassword(body.password) };
}

export function parseUpdateFundingCommentBody(body) {
  requireObject(body);
  return { password: parsePassword(body.password), comment: parseComment(body.comment) };
}
