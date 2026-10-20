# CineFund Backend — 팀원 실행 가이드

CineFund 백엔드를 **내 PC에서 처음 실행하는 방법**, **다음 작업일부터 실행하는 방법**, **Prisma DB 구조**를 정리한 문서입니다.

> **기준: 2026-10-19 백엔드 코드**  
> 구현 완료: Docker PostgreSQL 18, Prisma 7.10.0, 영화 100편 JSON(출연 배우 포함), DB 마이그레이션·시드·검증, Express 서버와 `GET /health`.  
> **아직 미구현:** 영화 목록·상세·검색·랭킹·후원 관련 Express API. `pnpm dev`만으로 프론트엔드에서 영화 API를 호출할 수 있는 것은 아닙니다.

## 1. 시작 전 — 버전 확인

**터미널은 `package.json` 파일이 있는 `cinefund-backend/` 폴더에서 실행합니다.**

| 준비물         | 권장/필수 기준                                                 | 확인 명령어        |
| -------------- | -------------------------------------------------------------- | ------------------ |
| Node.js        | `22.12.0` 이상인 22.x **또는** 24.x 이상 (`package.json` 기준) | `node -v`          |
| pnpm           | `11.26.0` (`package.json`에 고정)                              | `pnpm -v`          |
| Docker Desktop | 설치 후 실행                                                   | `docker --version` |
| Git / VS Code  | 개발용 권장                                                    | `git --version`    |

pnpm이 없거나 버전이 다르면 아래 명령으로 설치합니다.

```bash
npm install -g pnpm@11.26.0   # pnpm 설치/버전 맞추기
pnpm -v                       # 11.26.0 확인
```

## 2. 처음 실행하는 팀원 — 순서대로 따라 하기

**Docker Desktop을 먼저 실행**하세요. 영화 JSON은 이미 준비되어 있으므로 **TMDB 키나 영화 재선정은 필요 없습니다.**

```bash
pnpm install --frozen-lockfile  # ① 의존성 설치 (pnpm-lock.yaml 기준)
cp .env.example .env            # ② 환경변수 파일 생성 (Git Bash)
pnpm db:up                     # ③ Docker에서 PostgreSQL 18 실행 (PC 포트 5435)
pnpm db:migrate                # ④ movies / fundings 테이블 생성
pnpm db:generate               # ⑤ Prisma Client 생성
pnpm db:seed                   # ⑥ 준비된 JSON 영화 100편을 DB에 저장
pnpm test:db                   # ⑦ 실제 DB 연결 및 영화 정보 검증
pnpm test                      # ⑧ 영화 선정 규칙 단위 테스트
pnpm dev                       # ⑨ Express 서버 실행 (기본 3000번 포트)
```

- **PowerShell**이라면 ②번 명령 대신 `Copy-Item .env.example .env`를 실행하세요.
- 이미 `.env`가 있다면 덮어쓰지 말고 **3절**의 값이 맞는지 확인하세요.
- `pnpm db:seed`는 `시딩 완료: 총 100편`, `pnpm test:db`는 `DB 테스트 통과`가 출력되면 정상입니다.
- `pnpm dev` 실행 후 브라우저에서 **<http://localhost:3000/health>** 를 열어 `{ "message": "서버 정상 작동!" }`이 보이면 Express가 실행된 것입니다. **이 응답만으로 DB 연결이 확인되지는 않습니다.**
- `pnpm test`는 **DB 없이 가능한 단위 테스트**, `pnpm test:db`는 **실제 DB 검증**입니다.

## 3. 환경변수 `.env`

`.env.example`을 복사하면 아래 설정이 들어갑니다.

```dotenv
DATABASE_URL="postgresql://cinefund:cinefund_local@127.0.0.1:5435/cinefund?schema=public"
TMDB_API_KEY=""
TMDB_API_TOKEN=""
```

| 설정                                 | 뜻                                         | 일반 팀원에게 필요한가?       |
| ------------------------------------ | ------------------------------------------ | ----------------------------- |
| `DATABASE_URL`                       | 내 PC의 Docker PostgreSQL 연결 주소        | **필수** (기본값 그대로 사용) |
| `TMDB_API_KEY` 또는 `TMDB_API_TOKEN` | TMDB 영화 목록을 **새로 선정할 때만** 사용 | **불필요** (공란 유지)        |

`5435`는 **내 PC에서 접속할 포트**이고, Docker 내부 PostgreSQL 포트는 `5432`입니다. `compose.yaml`의 사용자 이름·비밀번호·DB 이름과 `.env`가 서로 일치해야 합니다.

**`.env`와 TMDB 실제 키는 GitHub에 올리지 마세요.** `.env.example`만 공유합니다.

## 4. 다음 작업일부터 실행하기

처음 한 번 설치·시드가 끝났다면, 이후에는 주로 아래 두 명령만 사용합니다.

```bash
pnpm db:up       # Docker DB 켜기 (이미 실행 중이면 그대로 사용)
pnpm dev         # 백엔드 개발 서버 시작 (Ctrl + C로 서버 종료)
```

- DB 내용을 보고 싶을 때: `pnpm exec prisma studio`
- 팀원이 **새 패키지**를 추가했다면: `pnpm install --frozen-lockfile`
- 팀원이 **새 DB 마이그레이션**을 추가했다면: `pnpm db:migrate` → `pnpm db:generate`
- 팀에서 **영화 JSON 업데이트에 합의한 경우에만**: `pnpm db:seed` (DB 상태 확인 후)
- 작업 후 Docker DB 종료: `pnpm db:down` (**DB 데이터 유지**)

> **주의:** `pnpm exec prisma migrate reset` 또는 `docker compose down -v`는 기존 DB 데이터를 삭제할 수 있습니다. 팀원의 영화·후원 기록이 있는 DB에서 임의로 실행하지 마세요.

## 5. 폴더 구조 — 어디를 수정해야 할까?

```text
cinefund-backend/
├── data/
│   └── movieDetails.json         # 배우 정보를 포함한 선정 영화 100편 (기존 데이터)
├── prisma/
│   ├── schema.prisma             # Movie / Funding 테이블 설계 ⭐
│   ├── migrations/               # 초기 생성 및 목표액 컬럼 제거를 포함한 DB 변경 이력
│   └── seed.js                   # 영화 JSON → PostgreSQL 저장
├── src/
│   ├── config/db.js              # Prisma로 DB 연결
│   ├── movies/
│   │   ├── movieData.js          # JSON 읽기·검증·선정용 최소 제작비 기준 확인
│   │   ├── selectMovies.js       # TMDB에서 영화 100편 선정 (담당자용)
│   │   └── tmdb.js               # TMDB API 요청 (담당자용)
│   ├── utils/checkDb.js          # 실제 DB가 JSON과 일치하는지 검사
│   ├── app.js                    # Express 설정과 GET /health
│   └── server.js                 # 서버 실행
├── tests/movieData.test.js       # 단위 테스트
├── docs/                         # 설계·API 계약·팀 협업 문서
├── compose.yaml                  # Docker PostgreSQL 설정
├── prisma.config.js              # Prisma 환경설정/마이그레이션 위치
├── .env.example                  # 공유 가능한 환경변수 예시
├── package.json                  # pnpm 실행 명령어
├── pnpm-lock.yaml                # 패키지 버전 잠금 파일
└── README.md                     # 지금 읽는 문서
```

## 6. Prisma 스키마 쉽게 이해하기

`prisma/schema.prisma`는 **PostgreSQL에 어떤 테이블과 컬럼이 있고, 서로 어떻게 연결되는지** 정하는 파일입니다. 현재는 **테이블 2개**가 있습니다.

| Prisma 모델 | 실제 DB 테이블 | 용도                                                            |
| ----------- | -------------- | --------------------------------------------------------------- |
| `Movie`     | `movies`       | 영화 100편, USD 제작비·KRW 누적 후원액 저장                       |
| `Funding`   | `fundings`     | 어느 영화에 누가 얼마를 후원했는지 기록하는 구조 (API는 미구현) |

### 6-1. `Movie` — 영화 한 편의 정보

| Prisma 필드                          | 쉬운 설명                                       | 예시                           |
| ------------------------------------ | ----------------------------------------------- | ------------------------------ |
| `movieId`                            | **우리 DB가 만든 영화 고유번호 (기본키)**       | `1`                            |
| `tmdbId`                             | **TMDB에서 사용하는 영화 고유번호 (중복 금지)** | `550`                          |
| `title`, `originalTitle`             | 영화 제목, 원제                                 | `파이트 클럽`, `Fight Club`    |
| `director`, `actors`, `genres`       | 감독, 배우 이름 배열, 장르 배열                 | `actors: ["배우 A", "배우 B"]` |
| `overview`, `posterPath`, `tagline`  | 소개, 포스터 경로, 문구                         | `posterPath: "/...jpg"`        |
| `releaseDate`, `koreanCertification` | 개봉일, 한국 관람등급                           | `2026-01-01`, `12`             |
| `productionBudget`                   | TMDB 원본 제작비 **USD(달러)**                  | `1000000` = 100만 달러         |
| `totalFundedAmount`                  | 지금까지 모인 **KRW(원) 후원액**                | 신규 영화는 `0`                |
| `createdAt`, `updatedAt`             | 생성·수정 시각                                  | 자동 관리                      |
| `fundings`                           | 이 영화에 연결된 후원 기록 목록                 | 영화 1편 → 후원 여러 건        |

현재 스키마에 **`revenue`(매출), `backdropPath`(배경 이미지)는 없습니다.** 영화 선정 조건에도 매출 하한은 없습니다.

### 6-2. `Funding` — 후원 한 건의 정보

| Prisma 필드              | 쉬운 설명                                          |
| ------------------------ | -------------------------------------------------- |
| `fundingId`              | 후원 한 건의 고유번호 (기본키, BigInt)             |
| `movieId`                | **어떤 영화에 후원했는지** 저장하는 번호 (외래키)  |
| `nickname`               | 후원자 닉네임, 최대 8자 (`VARCHAR(8)`)             |
| `amount`                 | 후원한 금액 **KRW(원), BigInt**                    |
| `comment`                | 후원 코멘트, 최대 100자 (`VARCHAR(100)`)           |
| `passwordHash`           | 비밀번호 **해시값**을 저장할 컬럼 (원문 저장 금지) |
| `createdAt`, `updatedAt` | 후원 생성·수정 시각                                |
| `movie`                  | 연결된 `Movie` 한 편을 조회하는 관계 필드          |

**핵심 관계: 영화 1편에 후원은 여러 건(1:N)입니다.**

```text
Movie (movies)                  Funding (fundings)
movie_id | title                funding_id | movie_id | amount
---------|-----------           -----------|----------|-------
1        | 영화 A               101        | 1        | 10000
2        | 영화 B               102        | 1        | 20000
                                 103        | 2        | 5000

fundings.movie_id = movies.movie_id  # Movie 1번 ← Funding 101, 102번
                                   # Movie 2번 ← Funding 103번
```

- `Funding.movieId`는 **`Movie.movieId`**를 가리킵니다. **`tmdbId`가 아닙니다.**
- `onDelete: Restrict` 때문에 후원 기록이 연결된 영화를 함부로 삭제할 수 없습니다.
- 실제 후원을 등록하는 Express API는 아직 없으므로 **테이블이 있어도 실제 후원 기능이 완성된 상태는 아닙니다.**

### 6-3. Prisma 문법 읽는 법

아래는 현재 스키마의 **일부를 발췌**한 문법 설명입니다.

```prisma
model Movie {                                                 // Movie 모델 = DB의 movies 테이블
  movieId           Int      @id @default(autoincrement()) @map("movie_id") // 내부 PK, 자동 번호
  tmdbId            Int      @unique @map("tmdb_id")          // TMDB ID, 중복 금지
  actors            String[] @default([])                    // 배우 이름 여러 개, 기본 []
  productionBudget  BigInt?  @map("production_budget")        // USD 제작비, NULL 허용
  totalFundedAmount BigInt   @default(0) @map("total_funded_amount") // KRW 누적액, 기본 0
  fundings          Funding[]                                // 이 영화의 후원 목록 (1:N)
  @@map("movies")                                               // 실제 DB 테이블명
}

model Funding {
  fundingId BigInt @id @default(autoincrement()) @map("funding_id") // 후원 PK
  movieId   Int    @map("movie_id")                         // Movie.movieId 저장하는 외래키
  movie     Movie  @relation(fields: [movieId], references: [movieId], onDelete: Restrict)
  amount    BigInt                                          // 원화 후원액
  @@map("fundings")                                         // 실제 DB 테이블명
}
```

- `@id`: 기본키(PK), `@unique`: 중복 금지, `@default(0)`: 기본값 0
- `?`: `NULL` 허용, `[]`: 여러 값을 저장하는 배열, `BigInt`: 큰 정수
- `@map("movie_id")`: **코드 필드 이름(`movieId`)**과 **DB 컬럼 이름(`movie_id`)**을 연결
- `@@map("movies")`: **코드 모델 이름(`Movie`)**과 **DB 테이블 이름(`movies`)**을 연결
- `@relation(fields: [movieId], references: [movieId])`: **Funding의 movieId → Movie의 movieId** 연결
- `@updatedAt`: Prisma로 수정할 때 수정 시각 자동 갱신
- `@db.Date` / `@db.Timestamptz(3)`: PostgreSQL 날짜/시각 타입 지정

**Prisma 스키마를 고쳤다고 DB가 자동 변경되는 것은 아닙니다.** 담당자가 마이그레이션 파일을 생성·검토해 공유해야 하고, 팀원은 공유된 파일을 `pnpm db:migrate`로 적용합니다. 이 명령은 **기존 마이그레이션 적용**이지 **새 마이그레이션 생성**이 아닙니다. 모델 전체 정의는 [`prisma/schema.prisma`](prisma/schema.prisma)에서 확인하세요.

## 7. 영화 100편 데이터가 DB에 들어가는 흐름

### 7-1. 일반 팀원 (영화 재선정 X)

```text
data/movieDetails.json (이미 선정된 영화 100편 + 배우)
         ↓
src/movies/movieData.js (100편, 중복, 배우, 제작비 규칙 검증)
         ↓
prisma/seed.js (DB에 create/update)
         ↓
PostgreSQL movies 테이블 (pnpm db:seed)
         ↓
src/utils/checkDb.js (pnpm test:db)
```

**일반 팀원은 `pnpm movies:select`를 실행하지 않습니다.** 제공된 JSON은 실제로 **영화 100편 모두 `actors` 배열을 포함**합니다.

### 7-2. 데이터 선정 기준과 통화

- TMDB **인기순**, 이미 개봉한 작품, `adult=false`, **한국 관람등급 확인 가능** 및 청소년 관람불가(18·19세 등) 제외
- `tmdbId` **중복 없이 정확히 100편**
- TMDB 제작비(`budget`) **최소 25,000 USD** = 고정 환율로 **3,500만 원**. `0`·미확인·미달 제외
- 영화 감독·배우(최대 10명)·장르·포스터·개봉일·설명 등 저장
- **매출(`revenue`)·배경 이미지(`backdropPath`) 수집/검증 조건 없음**

| 구분        | DB 필드             | 단위    | 규칙                      |
| ----------- | ------------------- | ------- | ------------------------- |
| 제작비 원본 | `productionBudget`  | **USD** | TMDB `budget` 그대로 보관 |
| 누적 후원액 | `totalFundedAmount` | **KRW** | 신규 영화는 0원           |
| 개별 후원액 | `Funding.amount`    | **KRW** | 향후 후원 API에서 사용    |

**선정용 고정 환율:** 1 USD = 1,400 KRW는 최소 제작비 3,500만 원 상당(25,000 USD) 검증에만 사용합니다. 목표 펀딩액을 DB에 저장하거나 달성률을 계산하지 않습니다.

### 7-3. 영화 관련 JavaScript 파일이 3개인 이유

| 파일              | 역할                                        | 누가 사용하나요?                         |
| ----------------- | ------------------------------------------- | ---------------------------------------- |
| `movieData.js`    | 기존 JSON 검증, 영화 선정용 최소 제작비 기준 확인 | **일반 팀원도 필요** (seed/test 시 사용) |
| `selectMovies.js` | TMDB에서 영화 100편을 새로 선정해 JSON 작성 | **영화 데이터 담당자만**                 |
| `tmdb.js`         | TMDB API 요청·인증                          | **영화 데이터 담당자만**                 |

**재선정이 꼭 필요할 때만**, 담당자가 TMDB 키를 `.env`에 넣고 아래 명령을 실행합니다.

```bash
pnpm movies:select --refresh    # 주의: 기존 movieDetails.json 교체, 영화 ID가 달라질 수 있음
```

`pnpm movies:select`는 **JSON을 새로 만드는 명령**이고 `pnpm db:seed`는 **JSON을 DB에 넣는 명령**입니다. JSON이 이미 있으면 기본 `movies:select`는 중단합니다. `--refresh`는 JSON만 교체하며 DB·후원 기록을 바로 삭제하지는 않지만, **영화 ID가 달라지면 재시드 시 기존 DB와 충돌하여 중단**될 수 있습니다. 팀과 합의한 뒤 진행하세요.

기존 데이터에 재시드할 때는 **영화 메타데이터만 업데이트**하고, `totalFundedAmount`·후원 기록은 유지합니다. 단, **기존 DB에 JSON에 없는 영화가 있으면 삭제 대신 오류로 중단**합니다. 이전 후원 금액이 USD로 저장된 적이 있다면 KRW로 자동 이전하지 않으므로 별도 점검이 필요합니다.

## 8. DB 내용 확인 — Prisma Studio와 조회 예시

Docker DB가 실행 중이고 2절의 초기 설정을 완료한 뒤:

```bash
pnpm exec prisma studio   # 출력된 로컬 주소를 브라우저에서 열기
```

- **`Movie`**: `movieId`, `tmdbId`, `title`, `actors`, `productionBudget`, `totalFundedAmount` 등 확인 (영화 100편)
- **`Funding`**: 후원 기록 확인 (아직 후원 기능을 쓰지 않았다면 0건이어도 정상)
- Studio 종료는 `Ctrl + C` (Docker DB는 계속 실행)

추후 서비스 코드에서 Prisma로 조회할 때의 **예시**입니다. 아래 함수가 이미 구현되었다는 뜻은 아닙니다.

```js
import { prisma } from "../config/db.js"; // 예: src/services/movies.js 안에서

const movies = await prisma.movie.findMany(); // 영화 전체 조회
const movie = await prisma.movie.findUnique({ where: { movieId: 1 } }); // 내부 ID 1번 조회
const fundings = await prisma.funding.findMany({ where: { movieId: 1 } }); // 영화 1번 후원 조회
```

Prisma의 `BigInt`는 일반 JSON으로 그대로 응답할 수 없어, 현재 `src/app.js`에서는 **응답할 때만 문자열로 변환**하도록 설정했습니다. 실제 영화·후원 API를 구현할 때 이 점을 참고하세요.

## 9. 자주 쓰는 명령어 모음

| 하고 싶은 일                  | 명령어                           |
| ----------------------------- | -------------------------------- |
| 패키지 설치                   | `pnpm install --frozen-lockfile` |
| PostgreSQL 시작               | `pnpm db:up`                     |
| PostgreSQL 종료 (데이터 유지) | `pnpm db:down`                   |
| 팀에서 받은 마이그레이션 적용 | `pnpm db:migrate`                |
| Prisma Client 생성            | `pnpm db:generate`               |
| JSON 영화 100편 DB 저장       | `pnpm db:seed`                   |
| 실제 DB/영화 데이터 검사      | `pnpm test:db`                   |
| 단위 테스트                   | `pnpm test`                      |
| Express 개발 서버             | `pnpm dev`                       |
| DB 웹 화면                    | `pnpm exec prisma studio`        |
| 영화 JSON 재선정 (담당자만)   | `pnpm movies:select --refresh`   |

## 10. 오류가 날 때 먼저 확인하기

| 증상                           | 확인 방법                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm` 명령어가 없음           | `node -v`, `pnpm -v` 확인 후 1절의 설치 명령 실행                                                                                   |
| `pnpm db:up` 실패              | Docker Desktop 실행 여부, `docker ps -a` 확인                                                                                       |
| `5435` 포트가 사용 중          | 기존 컨테이너·프로그램 확인. 포트를 바꾼다면 **`compose.yaml` + `.env`를 함께 수정**                                                |
| `P1000 Authentication failed`  | `.env` DB 아이디/비밀번호와 기존 Docker DB의 실제 계정 확인. **기존 볼륨에 예전 비밀번호가 남아 있을 수 있음**. 무작정 DB 삭제 금지 |
| `P1001` 등 DB 접속 오류        | `pnpm db:up`, `DATABASE_URL`, 포트 `5435` 확인                                                                                      |
| Prisma Client를 못 찾음        | `pnpm db:generate` 실행                                                                                                             |
| `movieDetails.json` 오류       | JSON 존재 여부와 `actors`·제작비·100편 조건 확인                                                                                    |
| `pnpm db:seed`에서 목록 불일치 | **기존 DB 영화 목록과 JSON이 다름**. 기존 후원 기록 확인 후 담당자와 조율                                                           |
| `pnpm test`만 성공             | DB 검사까지 완료한 게 아님. `pnpm test:db` 별도로 실행                                                                              |
| `/api/movies` 요청이 안 됨     | **현재 구현된 라우트는 `/health`뿐**. 서비스 API는 별도 구현 필요                                                                   |

## 11. 협업할 때 주의할 점

- `package.json`과 `pnpm-lock.yaml`을 **함께 커밋**합니다. 이 프로젝트에서는 `package-lock.json`을 사용하지 않습니다.
- `node_modules/`, `.env`, TMDB 비밀키는 커밋하지 않습니다.
- **팀원마다 Docker DB는 별개**입니다. 같은 영화 JSON을 사용해도 각자의 후원 기록이 자동 공유되지는 않습니다. 공용 DB/API는 추후 별도 구성해야 합니다.
- 프론트엔드가 PostgreSQL에 직접 연결하지 않고 **React → Express API → Prisma → PostgreSQL** 순서로 사용하도록 구현합니다.
- 후원 기능을 구현할 때 **`Funding` 추가와 `Movie.totalFundedAmount` 증가를 하나의 DB 트랜잭션**으로 처리하고, 비밀번호는 **평문이 아닌 해시**로 저장해야 합니다. 현재 이 API는 구현 전입니다.
- 스키마 설계는 [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md), API 기획은 [`docs/API_SPEC.md`](docs/API_SPEC.md), 전체 구조는 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)를 참조하세요. **기획 문서의 제안과 실제 구현은 다를 수 있으므로 코드·마이그레이션을 우선 확인**합니다.
- 이 프로젝트는 CineFund 백엔드 코드입니다. 프론트엔드와는 HTTP API로 연동할 예정이며, 실제 API 연결과 배포 구성은 별도로 확인해야 합니다.

---

**핵심만 다시 보기:**

- **처음:** `pnpm install --frozen-lockfile` → `.env` 복사 → `pnpm db:up` → `pnpm db:migrate` → `pnpm db:generate` → `pnpm db:seed` → `pnpm test:db` → `pnpm dev`
- **평소:** `pnpm db:up` → `pnpm dev` (DB 확인은 `pnpm exec prisma studio`)
- **영화 재선정은 일반 팀원에게 필요 없음.** 제공된 JSON 100편과 배우 정보로 DB를 만들면 됩니다.
