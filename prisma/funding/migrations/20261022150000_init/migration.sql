CREATE TABLE "fundings" (
    "funding_id" BIGSERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "nickname" VARCHAR(8) NOT NULL,
    "amount" BIGINT NOT NULL,
    "comment" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fundings_pkey" PRIMARY KEY ("funding_id")
);

CREATE INDEX "fundings_movie_id_created_at_funding_id_idx"
ON "fundings"("movie_id", "created_at", "funding_id");
