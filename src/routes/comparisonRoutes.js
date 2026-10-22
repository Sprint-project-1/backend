import express from "express";
import { parseMovieIds } from "../validators/comparisonValidators.js";
import { getMoviesForComparison } from "../services/movieService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const movieIds = parseMovieIds(req.body);
  const result = await getMoviesForComparison(movieIds);
  res.json(result);
});

export default router;
