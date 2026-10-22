import { prisma } from "../src/config/db.js";
import { readMovieDetails } from "../src/movies/movieData.js";

async function main() {
  const details = await readMovieDetails();
  const fixed = new Set(details.map((movie) => movie.tmdbId));

  const existing = await prisma.movie.findMany({ select: { tmdbId: true } });
  const unexpected = existing.filter((row) => !fixed.has(row.tmdbId));
  if (unexpected.length) {
    throw new Error(
      `DB에 고정 목록 외 영화 ${unexpected.length}개가 있습니다. 자동 삭제하지 않습니다.`,
    );
  }

  // readMovieDetails()에서 제작비 3,500만 원 상당 이상인 영화 100편인지 확인합니다.
  // 원본 제작비는 USD로 저장합니다. 영화 선정 시 최소 제작비 환율 기준만 사용합니다.
  // Funding 원장은 별도 DB에서 관리하므로 영화 seed는 펀딩 기록을 변경하지 않습니다.
  await prisma.$transaction(
    details.map((movie) => {
      const data = {
        title: movie.title,
        originalTitle: movie.originalTitle ?? null, // 영화 원제 추가
        koreanCertification: movie.koreanCertification ?? null, // 한국 관람 등급 추가
        director: movie.director,
        genres: movie.genres,
        actors: movie.actors, // 기존 후원액과 무관하게 배우 정보만 업데이트
        overview: movie.overview,
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate
          ? new Date(`${movie.releaseDate}T00:00:00.000Z`)
          : null,
        tagline: movie.tagline || null,
        productionBudget: BigInt(movie.budget), // TMDB 원본 제작비(USD)
      };

      return prisma.movie.upsert({
        where: { tmdbId: movie.tmdbId },
        create: {
          tmdbId: movie.tmdbId,
          ...data,
        },
        update: { ...data },
      });
    }),
  );

  const count = await prisma.movie.count();
  if (count !== 100)
    throw new Error(`시딩 오류: DB 영화 수 ${count} (예상 100)`);
  console.log(
    `시딩 완료: 총 ${count}편 / 제작비 최소 3,500만 원 상당 / 기존 후원 금액 유지`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
