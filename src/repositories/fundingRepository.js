import { fundingPrisma } from "../config/db.js";

function totalAmount(amount) {
  return amount ?? 0n;
}

async function aggregateForMovie(client, movieId) {
  const result = await client.funding.aggregate({
    where: { movieId },
    _sum: { amount: true },
  });
  return totalAmount(result._sum.amount);
}

export const fundingRepository = {
  async totalsByMovieIds(movieIds) {
    if (movieIds.length === 0) return new Map();

    const rows = await fundingPrisma.funding.groupBy({
      by: ["movieId"],
      where: { movieId: { in: movieIds } },
      _sum: { amount: true },
    });

    return new Map(rows.map((row) => [row.movieId, totalAmount(row._sum.amount)]));
  },

  listByMovie(movieId, limit, cursor) {
    const where = { movieId };
    if (cursor) {
      where.OR = [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, fundingId: { lt: cursor.fundingId } },
      ];
    }

    return fundingPrisma.funding.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { fundingId: "desc" }],
      take: limit + 1,
    });
  },

  findById(fundingId) {
    return fundingPrisma.funding.findUnique({ where: { fundingId } });
  },

  createWithTotal(input) {
    return fundingPrisma.$transaction(async (tx) => {
      const funding = await tx.funding.create({ data: input });
      const total = await aggregateForMovie(tx, input.movieId);
      return { funding, totalFundedAmount: total.toString() };
    });
  },

  updateComment(fundingId, comment) {
    return fundingPrisma.funding.update({
      where: { fundingId },
      data: { comment },
      select: { fundingId: true, movieId: true, comment: true, updatedAt: true },
    });
  },

  cancelWithTotal(fundingId, movieId) {
    return fundingPrisma.$transaction(async (tx) => {
      const deleted = await tx.funding.deleteMany({ where: { fundingId } });
      if (deleted.count === 0) return null;

      const total = await aggregateForMovie(tx, movieId);
      return { totalFundedAmount: total.toString() };
    });
  },
};
