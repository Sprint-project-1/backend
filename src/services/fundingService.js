import { prisma } from "../config/db.js";
import { createError } from "../errors/createError.js";
import { hashFundingPassword, verifyFundingPassword } from "../utils/fundingPassword.js";

function movieNotFound() {
  return createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
}

function fundingNotFound() {
  return createError(404, "FUNDING_NOT_FOUND", "펀딩 기록을 찾을 수 없습니다.");
}

function invalidCredential() {
  return createError(403, "INVALID_CREDENTIAL", "비밀번호가 일치하지 않습니다.");
}

export async function createFunding(movieId, input) {
  const passwordHash = await hashFundingPassword(input.password);
  return prisma.$transaction(async (tx) => {
    const movie = await tx.movie.findUnique({ where: { movieId }, select: { movieId: true } });
    if (!movie) throw movieNotFound();

    const funding = await tx.funding.create({
      data: {
        movieId,
        nickname: input.nickname,
        amount: input.amount,
        comment: input.comment,
        passwordHash,
      },
      select: { fundingId: true, movieId: true, nickname: true, amount: true, comment: true, createdAt: true },
    });
    const updatedMovie = await tx.movie.update({
      where: { movieId },
      data: { totalFundedAmount: { increment: input.amount } },
      select: { totalFundedAmount: true },
    });

    return {
      funding: {
        fundingId: funding.fundingId.toString(),
        movieId: funding.movieId,
        nickname: funding.nickname,
        amount: funding.amount.toString(),
        comment: funding.comment,
        createdAt: funding.createdAt.toISOString(),
      },
      totalFundedAmount: updatedMovie.totalFundedAmount.toString(),
    };
  });
}

export async function cancelFunding(fundingId, password) {
  const current = await prisma.funding.findUnique({ where: { fundingId } });
  if (!current) throw fundingNotFound();
  if (!(await verifyFundingPassword(password, current.passwordHash))) throw invalidCredential();

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.funding.deleteMany({
      where: { fundingId, passwordHash: current.passwordHash },
    });
    if (deleted.count !== 1) throw fundingNotFound();

    const movie = await tx.movie.update({
      where: { movieId: current.movieId },
      data: { totalFundedAmount: { decrement: current.amount } },
      select: { totalFundedAmount: true },
    });
    return {
      fundingId: fundingId.toString(),
      movieId: current.movieId,
      totalFundedAmount: movie.totalFundedAmount.toString(),
    };
  });
}

export async function updateFundingComment(fundingId, password, comment) {
  const current = await prisma.funding.findUnique({ where: { fundingId } });
  if (!current) throw fundingNotFound();
  if (!(await verifyFundingPassword(password, current.passwordHash))) throw invalidCredential();

  const updated = await prisma.funding.updateMany({
    where: { fundingId, passwordHash: current.passwordHash },
    data: { comment },
  });
  if (updated.count !== 1) throw fundingNotFound();

  const funding = await prisma.funding.findUnique({
    where: { fundingId },
    select: { fundingId: true, movieId: true, comment: true, updatedAt: true },
  });
  if (!funding) throw fundingNotFound();
  return {
    fundingId: funding.fundingId.toString(),
    movieId: funding.movieId,
    comment: funding.comment,
    updatedAt: funding.updatedAt.toISOString(),
  };
}
