import { prisma } from "../config/db.js";

export const movieRepository = {
  findById(movieId, select) {
    return prisma.movie.findUnique({
      where: { movieId },
      ...(select ? { select } : {}),
    });
  },

  findAll() {
    return prisma.movie.findMany();
  },

  findByIds(movieIds) {
    return prisma.movie.findMany({
      where: { movieId: { in: movieIds } },
    });
  },
};
