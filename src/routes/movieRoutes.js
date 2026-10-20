import express from "express";
import { parseMovieId, parseListQuery } from "../utils/validators.js";
import { getMovieById, listMovies } from "../services/movieService.js";

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

export default router;