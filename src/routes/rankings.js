import express from "express";
import { createError } from "../errors/createError.js";
import { parseLimit } from "../utils/validators.js";
import { listRankings } from "../services/rankingService.js";

const router = express.Router();

function invalidQuery() {
  return createError(400, "VALIDATION_ERROR", "요청 값을 확인해 주세요.");
}

router.get("/", async (req, res) => {
  const limit = parseLimit(req.query.limit, 10, 50); // 기본 10개, 최대 50개
  const sortBy = req.query.sortBy ?? "amount"; // 기본 펀딩액 정렬
  const order = req.query.order ?? "desc"; // 기본 내림차순

  if (sortBy !== "amount" && sortBy !== "achievementRate") {
    throw invalidQuery(); // 지원하지 않는 정렬 기준이면 400
  }

  if (order !== "asc" && order !== "desc") {
    throw invalidQuery(); // 잘못된 정렬 방향이면 400
  }

  const result = await listRankings(
    { limit, sortBy, order }, // 검사한 요청 조건 전달
    req.query.cursor, // 다음 페이지 커서 전달
  );

  res.json(result); // 결과를 프론트엔드로 반환
});

export default router;
