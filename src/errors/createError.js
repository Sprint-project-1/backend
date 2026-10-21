export function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.isMyError = true;
  return error;
}