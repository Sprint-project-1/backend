function getAllowedOrigins() {
  const text = process.env.CORS_ORIGINS || "";
  return text
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");
}

export function cors(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = origin !== undefined && allowedOrigins.includes(origin);

  res.vary("Origin");

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  const isPreflight =
    req.method === "OPTIONS" && req.headers["access-control-request-method"] !== undefined;
  if (isPreflight) {
    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Max-Age", "600");
    }
    return res.status(204).end();
  }

  next();
}