import "dotenv/config";

const ROOT = "https://api.themoviedb.org/3";

export async function tmdbGet(path, query = {}) {
  const key = process.env.TMDB_API_KEY?.trim();
  const token = process.env.TMDB_API_TOKEN?.trim();
  if (!key && !token) {
    throw new Error("TMDB_API_KEY 또는 TMDB_API_TOKEN을 .env에 입력하세요.");
  }
  const url = new URL(`${ROOT}${path}`);
  for (const [name, value] of Object.entries(query)) {
    url.searchParams.set(name, String(value));
  }
  if (!token) url.searchParams.set("api_key", key);

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
        : { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) return response.json();
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      const retryAfter = response.headers.get("retry-after");
      const seconds = retryAfter === null ? NaN : Number(retryAfter);
      const retryDate = retryAfter === null ? NaN : Date.parse(retryAfter);

      const delay =
        Number.isFinite(seconds) && seconds >= 0
          ? seconds * 1000 // 초 단위 대기 시간
          : Number.isFinite(retryDate)
            ? Math.max(0, retryDate - Date.now()) // 날짜 형식 대기 시간
            : 600 * (attempt + 1); // 안내가 없으면 기본 대기

      if (delay > 10000) {
        throw new Error(
          `TMDB API 재시도 중단: 대기 시간이 10초를 초과합니다. (${path})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    throw new Error(`TMDB API 오류: HTTP ${response.status} (${path})`);
  }
}
