import { prisma } from "../config/db.js";
import { readMovieDetails } from "../movies/movieData.js";

async function main() {
  const version = await prisma.$queryRaw`SHOW server_version`;
  const postgresVersion = version[0]?.server_version ?? "unknown";
  if (!postgresVersion.startsWith("18.")) {
    throw new Error(`PostgreSQL 버전 불일치: ${postgresVersion} (18.x 필요)`);
  }
  console.log(`1/3 PostgreSQL 연결 성공: ${postgresVersion}`);

  const details = await readMovieDetails();
  const snapshots = new Map(details.map((movie) => [movie.tmdbId, movie]));
  const rows = await prisma.movie.findMany();
  if (rows.length !== 100) throw new Error(`2/3 실패: 실제 ${rows.length}편 / 기대 100편`);

  const expected = new Set(details.map((movie) => movie.tmdbId));
  for (const row of rows) {
    const movie = snapshots.get(row.tmdbId);
    if (!expected.has(row.tmdbId) || !movie) throw new Error(`DB 영화 ID 불일치: ${row.tmdbId}`);
    if (row.title !== movie.title || row.director !== movie.director
      || row.originalTitle !== (movie.originalTitle ?? null)
      || row.koreanCertification !== (movie.koreanCertification ?? null)
      || JSON.stringify(row.genres) !== JSON.stringify(movie.genres)
      || JSON.stringify(row.actors) !== JSON.stringify(movie.actors)
      || row.overview !== movie.overview || row.posterPath !== movie.posterPath
      || row.productionBudget !== BigInt(movie.budget)
      || row.totalFundedAmount < 0n
      || (movie.releaseDate && row.releaseDate?.toISOString().slice(0, 10) !== movie.releaseDate)
      || row.tagline !== (movie.tagline || null)) {
      throw new Error(`영화 정보 또는 펀딩 금액 불일치: ${row.tmdbId}`);
    }
  }
  const fundingTotals = await prisma.funding.groupBy({
    by: ["movieId"],
    _sum: { amount: true },
  });
  const totalsByMovieId = new Map(
    fundingTotals.map(({ movieId, _sum }) => [movieId, _sum.amount ?? 0n]),
  );
  for (const row of rows) {
    const fundingTotal = totalsByMovieId.get(row.movieId) ?? 0n;
    if (fundingTotal !== row.totalFundedAmount) {
      throw new Error(
        `펀딩 원장 합계 불일치: ${row.tmdbId} (누적액 ${row.totalFundedAmount}, 원장 합계 ${fundingTotal})`,
      );
    }
  }
  console.log("2/3 고정 영화 ID 100편 일치");
  console.log("3/3 영화 정보·제작비(USD)·누적 펀딩(KRW)·Funding 원장 합계 검증 성공");
  console.log("DB 테스트 통과 ✅");
}

main()
  .catch((error) => { console.error(`DB 테스트 실패: ${error.message}`); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
