import express from "express";
import {
  parseMovieId,
  parseListQuery,
  parseLimit,
} from "../utils/validators.js";
import { getMovieById, listMovies } from "../services/movieService.js";
import { listComments } from "../services/commentService.js";

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
  const limit = parseLimit(req.query.limit, 10, 10);
  const result = await listComments(movieId, limit, req.query.cursor);
  res.json(result);
});

export default router;
