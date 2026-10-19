-- 기존 영화 및 후원 기록을 유지하고 사용하지 않는 목표액 컬럼만 제거합니다.
ALTER TABLE "movies" DROP COLUMN "funding_goal";
