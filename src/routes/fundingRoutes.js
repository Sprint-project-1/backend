import express from "express";
import { createFunding, cancelFunding, updateFundingComment } from "../services/fundingService.js";
import { parseFundingId, parseMovieId } from "../utils/validators.js";
import { parseCreateFundingBody, parseCancelFundingBody, parseUpdateFundingCommentBody } from "../utils/fundingValidators.js";

const router = express.Router();

router.post("/movies/:movieId/fundings", async (req, res) => {
  const movieId = parseMovieId(req.params.movieId);
  const input = parseCreateFundingBody(req.body);
  const result = await createFunding(movieId, input);
  res.status(201).json(result);
});

router.post("/fundings/:fundingId/cancel", async (req, res) => {
  const fundingId = parseFundingId(req.params.fundingId);
  const { password } = parseCancelFundingBody(req.body);
  res.json(await cancelFunding(fundingId, password));
});

router.patch("/fundings/:fundingId/comment", async (req, res) => {
  const fundingId = parseFundingId(req.params.fundingId);
  const input = parseUpdateFundingCommentBody(req.body);
  res.json({ funding: await updateFundingComment(fundingId, input.password, input.comment) });
});

export default router;
