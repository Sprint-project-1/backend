import express from "express";
import { COMMENT_LIST_LIMIT } from "../config/limits.js";
import { parseMovieId, parseListQuery, parseLimit } from "../validators/movieValidators.js";
import { parseFundingInput } from "../validators/fundingValidators.js";
import { getMovieById, listMovies } from "../services/movieService.js";
import { listComments } from "../services/commentService.js";
import { createFunding } from "../services/fundingService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const params = parseListQuery(req.query);
  const result = await listMovies(params, req.query.cursor);
  res.json(result);
});

router.get("/:movieId", async (req, res) => {
  const movieId = parseMovieId(req.params.movieId);
  const movie = await getMovieById(movieId);
  res.json({ movie: movie });
});

router.get("/:movieId/comments", async (req, res) => {
  const movieId = parseMovieId(req.params.movieId);
  const limit = parseLimit(req.query.limit, COMMENT_LIST_LIMIT);
  const result = await listComments(movieId, limit, req.query.cursor);
  res.json(result);
});

router.post("/:movieId/fundings", async (req, res) => {
  const movieId = parseMovieId(req.params.movieId);
  const input = parseFundingInput(req.body);
  const result = await createFunding(movieId, input);
  res.status(201).json(result);
});

export default router;
