import { createError } from "../errors/createError.js";
import { fundingRepository } from "../repositories/fundingRepository.js";
import { movieRepository } from "../repositories/movieRepository.js";
import { hashPassword, verifyPassword } from "../utils/passwordHash.js";

function fundingNotFound() {
  return createError(404, "FUNDING_NOT_FOUND", "펀딩 기록을 찾을 수 없습니다.");
}

function invalidCredential() {
  return createError(403, "INVALID_CREDENTIAL", "비밀번호가 올바르지 않습니다.");
}

function toFundingResponse(funding) {
  return {
    fundingId: funding.fundingId.toString(),
    movieId: funding.movieId,
    nickname: funding.nickname,
    amount: funding.amount.toString(),
    comment: funding.comment,
    createdAt: funding.createdAt.toISOString(),
  };
}

export async function createFunding(movieId, input) {
  const movie = await movieRepository.findById(movieId, { movieId: true });
  if (movie === null) {
    throw createError(404, "MOVIE_NOT_FOUND", "영화를 찾을 수 없습니다.");
  }

  const passwordHash = await hashPassword(input.password);
  const result = await fundingRepository.createWithTotal({
    movieId,
    nickname: input.nickname,
    amount: input.amount,
    comment: input.comment,
    passwordHash,
  });

  return {
    funding: toFundingResponse(result.funding),
    totalFundedAmount: result.totalFundedAmount,
  };
}

export async function updateFundingComment(fundingId, input) {
  const existing = await fundingRepository.findById(fundingId);
  if (existing === null) throw fundingNotFound();
  if (!(await verifyPassword(input.password, existing.passwordHash))) {
    throw invalidCredential();
  }

  let funding;
  try {
    funding = await fundingRepository.updateComment(fundingId, input.comment);
  } catch (error) {
    if (error.code === "P2025") throw fundingNotFound();
    throw error;
  }

  return {
    funding: {
      fundingId: funding.fundingId.toString(),
      movieId: funding.movieId,
      comment: funding.comment,
      updatedAt: funding.updatedAt.toISOString(),
    },
  };
}

export async function cancelFunding(fundingId, password) {
  const existing = await fundingRepository.findById(fundingId);
  if (existing === null) throw fundingNotFound();
  if (!(await verifyPassword(password, existing.passwordHash))) {
    throw invalidCredential();
  }

  const result = await fundingRepository.cancelWithTotal(
    fundingId,
    existing.movieId,
  );
  if (result === null) throw fundingNotFound();

  return {
    fundingId: existing.fundingId.toString(),
    movieId: existing.movieId,
    totalFundedAmount: result.totalFundedAmount,
  };
}
