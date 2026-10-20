import express from "express";
import { parseMovieId } from "../utils/validators.js";
import { getMovieById } from "../services/movieService.js";

const router = express.Router();

router.get("/:movieId", async (req, res) => {
  const movieId = parseMovieId(req.params.movieId);
  const movie = await getMovieById(movieId);
  res.json({movie: movie });
});

export default router;