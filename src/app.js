import express from "express";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import movieRoutes from "./routes/movieRoutes.js";

const app = express();

app.use(express.json());

// ==========================================
// BigInt → String 변환
// Prisma의 큰 금액(BigInt)은 JSON으로 바로 전달할 수 없어 오류가 발생함
// 따라서 API 응답에서만 문자열로 변환 (DB의 BigInt 타입은 유지)
app.set("json replacer", (key, value) =>
  typeof value === "bigint" ? value.toString() : value,
);

app.get("/health", (req, res) => {
  res.json({ message: "서버 정상 작동!" });
});

app.use("/api/movies", movieRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
