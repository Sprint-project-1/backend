import test from "node:test";
import assert from "node:assert/strict";

const configuredBaseUrl = process.env.API_BASE_URL;

test(
  "HTTP API integration against a running CineFund server",
  { skip: !configuredBaseUrl },
  async (t) => {
    const baseUrl = configuredBaseUrl.replace(/\/+$/, "");

    async function request(path, options = {}) {
      const response = await fetch(`${baseUrl}${path}`, options);
      assert.match(response.headers.get("content-type") ?? "", /application\/json/);
      return { response, body: await response.json() };
    }

    async function findMovie(title) {
      const { body } = await request(
        `/api/movies?limit=10&q=${encodeURIComponent(title)}`,
      );
      return body.items.find((movie) => movie.title === title);
    }

    await t.test("GET /health returns 200", async () => {
      const { response, body } = await request("/health");
      assert.equal(response.status, 200);
      assert.equal(body.message, "서버 정상 작동!");
    });

    await t.test("movie list cursor returns a distinct next page", async () => {
      const first = await request("/api/movies?limit=3");
      assert.equal(first.response.status, 200);
      assert.equal(first.body.items.length, 3);
      assert.equal(typeof first.body.items[0].totalFundedAmount, "string");
      assert.equal(first.body.page.hasMore, true);

      const cursor = encodeURIComponent(first.body.page.nextCursor);
      const second = await request(`/api/movies?limit=3&cursor=${cursor}`);
      assert.equal(second.response.status, 200);
      assert.equal(second.body.items.length, 3);
      const ids = new Set(first.body.items.map((movie) => movie.movieId));
      assert.ok(second.body.items.every((movie) => !ids.has(movie.movieId)));
    });

    let descendingAmounts;
    for (const order of ["desc", "asc"]) {
      await t.test(`funding amounts are sorted ${order} across all pages`, async () => {
        const movies = [];
        const cursors = new Set();
        let cursor;

        do {
          const query = new URLSearchParams({ sortBy: "amount", order, limit: "17" });
          if (cursor) query.set("cursor", cursor);
          const { response, body } = await request(`/api/movies?${query}`);
          assert.equal(response.status, 200);
          assert.ok(body.items.length > 0 && body.items.length <= 17);
          assert.equal(typeof body.page.hasMore, "boolean");
          movies.push(...body.items);

          if (!body.page.hasMore) {
            assert.equal(body.page.nextCursor, null);
            break;
          }
          cursor = body.page.nextCursor;
          assert.equal(typeof cursor, "string");
          assert.ok(cursor.length > 0 && !cursors.has(cursor));
          cursors.add(cursor);
          assert.ok(cursors.size < 100, "pagination must terminate");
        } while (true);

        assert.equal(movies.length, 100);
        assert.equal(new Set(movies.map((movie) => movie.movieId)).size, 100);
        for (const movie of movies) {
          assert.equal(typeof movie.totalFundedAmount, "string");
          assert.match(movie.totalFundedAmount, /^(0|[1-9]\d*)$/);
        }
        for (let index = 1; index < movies.length; index++) {
          const previous = movies[index - 1];
          const current = movies[index];
          const previousAmount = BigInt(previous.totalFundedAmount);
          const currentAmount = BigInt(current.totalFundedAmount);
          if (previousAmount === currentAmount) {
            assert.ok(previous.movieId < current.movieId, "equal amounts use movieId asc");
          } else {
            assert.ok(order === "desc"
              ? previousAmount > currentAmount
              : previousAmount < currentAmount);
          }
        }

        const amountsById = movies
          .map((movie) => [movie.movieId, movie.totalFundedAmount])
          .sort((a, b) => a[0] - b[0]);
        if (order === "desc") {
          descendingAmounts = amountsById;
          const defaultOrder = await request("/api/movies?sortBy=amount&limit=17");
          assert.equal(defaultOrder.response.status, 200);
          assert.deepEqual(
            defaultOrder.body.items.map((movie) => movie.movieId),
            movies.slice(0, 17).map((movie) => movie.movieId),
          );
        } else {
          assert.deepEqual(amountsById, descendingAmounts);
        }
      });
    }

    await t.test("movie title search returns matching results", async () => {
      const movie = await findMovie("스파이더맨: 브랜드 뉴 데이");
      assert.ok(movie);
      assert.equal(movie.title, "스파이더맨: 브랜드 뉴 데이");
    });

    await t.test("movie detail returns the documented fields", async () => {
      const match = await findMovie("스파이더맨: 브랜드 뉴 데이");
      assert.ok(match);
      const { response, body } = await request(`/api/movies/${match.movieId}`);
      assert.equal(response.status, 200);
      assert.equal(body.movie.movieId, match.movieId);
      assert.equal(typeof body.movie.productionBudget, "string");
      assert.match(body.movie.releaseDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(Array.isArray(body.movie.actors));
    });

    await t.test("comments endpoint returns a safe paged response", async () => {
      const match = await findMovie("스파이더맨: 브랜드 뉴 데이");
      assert.ok(match);
      const { response, body } = await request(
        `/api/movies/${match.movieId}/comments`,
      );
      assert.equal(response.status, 200);
      assert.ok(Array.isArray(body.items));
      assert.ok(body.items.length <= 10);
      assert.ok(body.items.every((item) => !("passwordHash" in item)));
    });

    await t.test("comparison preserves the submitted movie order", async () => {
      const { body: search } = await request(
        `/api/movies?limit=10&q=${encodeURIComponent("스파이더맨")}`,
      );
      assert.ok(search.items.length >= 2);
      const ids = search.items.slice(0, 2).map((movie) => movie.movieId).reverse();
      const { response, body } = await request("/api/comparisons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieIds: ids }),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(body.items.map((movie) => movie.movieId), ids);
    });

    await t.test("invalid inputs return VALIDATION_ERROR 400", async () => {
      const list = await request("/api/movies?limit=51");
      assert.equal(list.response.status, 400);
      assert.equal(list.body.error.code, "VALIDATION_ERROR");

      const comparison = await request("/api/comparisons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieIds: [1, 1] }),
      });
      assert.equal(comparison.response.status, 400);
      assert.equal(comparison.body.error.code, "VALIDATION_ERROR");
    });

    await t.test("malformed and oversized JSON have client error responses", async () => {
      const malformed = await request("/api/comparisons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad json",
      });
      assert.equal(malformed.response.status, 400);
      assert.equal(malformed.body.error.code, "VALIDATION_ERROR");

      const oversized = await request("/api/comparisons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieIds: [1, 2], note: "x".repeat(110_000) }),
      });
      assert.equal(oversized.response.status, 413);
      assert.equal(oversized.body.error.code, "PAYLOAD_TOO_LARGE");

      const unsupportedCharset = await request("/api/comparisons", {
        method: "POST",
        headers: { "content-type": "application/json; charset=madeup" },
        body: JSON.stringify({ movieIds: [1, 2] }),
      });
      assert.equal(unsupportedCharset.response.status, 415);
      assert.equal(unsupportedCharset.body.error.code, "UNSUPPORTED_MEDIA_TYPE");

      const unsupportedEncoding = await request("/api/comparisons", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-encoding": "compress",
        },
        body: JSON.stringify({ movieIds: [1, 2] }),
      });
      assert.equal(unsupportedEncoding.response.status, 415);
      assert.equal(unsupportedEncoding.body.error.code, "UNSUPPORTED_MEDIA_TYPE");

      const emptyBody = await request("/api/comparisons", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      assert.equal(emptyBody.response.status, 400);
      assert.equal(emptyBody.body.error.code, "VALIDATION_ERROR");
    });

    await t.test("bad cursor and unknown route return client errors", async () => {
      const cursor = await request("/api/movies?limit=3&cursor=!!!");
      assert.equal(cursor.response.status, 400);
      assert.equal(cursor.body.error.code, "VALIDATION_ERROR");

      const malformedPath = await request("/api/movies/%E0%A4%A");
      assert.equal(malformedPath.response.status, 400);
      assert.equal(malformedPath.body.error.code, "VALIDATION_ERROR");

      const route = await request("/api/unknown");
      assert.equal(route.response.status, 404);
      assert.equal(route.body.error.code, "NOT_FOUND");
    });

    await t.test("unknown movie returns MOVIE_NOT_FOUND 404", async () => {
      const { response, body } = await request("/api/movies/2147483647");
      assert.equal(response.status, 404);
      assert.equal(body.error.code, "MOVIE_NOT_FOUND");
    });
  },
);
