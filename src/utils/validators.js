// Backward-compatible export surface for scripts and existing callers.
export { parseMovieId, parseListQuery, parseLimit } from "../validators/movieValidators.js";
export {
  parseFundingId,
  parseFundingInput,
  parseFundingPassword,
  parseFundingComment,
} from "../validators/fundingValidators.js";
export { parseMovieIds } from "../validators/comparisonValidators.js";
