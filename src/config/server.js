const DEFAULT_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

function readPort(value) {
  if (value === undefined || value === "") return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error("PORT는 1~65535 사이의 정수여야 합니다.");
  }
  return port;
}

export const serverConfig = Object.freeze({
  port: readPort(process.env.PORT),
});
