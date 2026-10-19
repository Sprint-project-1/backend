-- CreateTable
CREATE TABLE "movies" (
    "movie_id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "poster_path" TEXT,
    "overview" TEXT,
    "director" TEXT,
    "release_date" DATE,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "original_title" TEXT,
    "korean_certification" TEXT,
    "tagline" TEXT,
    "production_budget" BIGINT,
    "funding_goal" BIGINT,
    "total_funded_amount" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("movie_id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdb_id_key" ON "movies"("tmdb_id");

-- CreateIndex
CREATE INDEX "fundings_movie_id_created_at_funding_id_idx" ON "fundings"("movie_id", "created_at", "funding_id");

-- AddForeignKey
ALTER TABLE "fundings" ADD CONSTRAINT "fundings_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE;
