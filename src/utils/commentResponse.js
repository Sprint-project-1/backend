export function toCommentResponse(funding) {
  const result = {
    fundingId: funding.fundingId.toString(),
    movieId: funding.movieId,
    nickname: funding.movieId,
    amount: funding.amount.toString(),
    comment: funding.comment,
    createdAt: funding.createdAt.toISOString(),
  };
  return result;
}