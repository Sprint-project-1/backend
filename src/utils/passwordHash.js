import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  const { N, r, p } = SCRYPT_OPTIONS;

  return [
    "scrypt",
    N,
    r,
    p,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") {
    return false;
  }

  const [algorithm, nText, rText, pText, saltText, keyText, ...extra] =
    storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    nText !== String(SCRYPT_OPTIONS.N) ||
    rText !== String(SCRYPT_OPTIONS.r) ||
    pText !== String(SCRYPT_OPTIONS.p) ||
    !saltText ||
    !keyText ||
    extra.length > 0
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltText, "base64url");
    const expectedKey = Buffer.from(keyText, "base64url");
    if (salt.length !== 16 || expectedKey.length !== KEY_LENGTH) {
      return false;
    }

    const actualKey = await scrypt(
      password,
      salt,
      KEY_LENGTH,
      SCRYPT_OPTIONS,
    );
    return timingSafeEqual(actualKey, expectedKey);
  } catch {
    return false;
  }
}
