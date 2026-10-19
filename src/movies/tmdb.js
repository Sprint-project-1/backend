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
      headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) return response.json();
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      const retry = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retry) && retry > 0 ? Math.min(retry * 1000, 10000) : 600 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    throw new Error(`TMDB API 오류: HTTP ${response.status} (${path})`);
  }
}
