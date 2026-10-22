import express from "express";
import { cancelFunding, updateFundingComment } from "../services/fundingService.js";
import {
  parseFundingComment,
  parseFundingId,
  parseFundingPassword,
} from "../validators/fundingValidators.js";

const router = express.Router();

router.post("/:fundingId/cancel", async (req, res) => {
  const fundingId = parseFundingId(req.params.fundingId);
  const password = parseFundingPassword(req.body);
  const result = await cancelFunding(fundingId, password);
  res.json(result);
});

router.patch("/:fundingId/comment", async (req, res) => {
  const fundingId = parseFundingId(req.params.fundingId);
  const input = parseFundingComment(req.body);
  const result = await updateFundingComment(fundingId, input);
  res.json(result);
});

export default router;
