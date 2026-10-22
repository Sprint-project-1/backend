# CineFund Backend

CineFund 모의 펀딩 서비스의 Express API 서버입니다. 브라우저는 HTTP API를 호출하고, 서버는 Prisma를 통해 PostgreSQL에 접근합니다. 실제 결제·로그인 기능은 포함하지 않습니다.

## 주요 구성

- Node.js, Express 5, Prisma 7, PostgreSQL 18
- 영화 메타데이터 100편을 고정 JSON으로 관리
- 로컬 PostgreSQL 컨테이너 하나에 `cinefund`(영화)와 `funding`(펀딩) 데이터베이스 사용
- Movie/Funding Prisma schema와 client를 분리
- API 경로와 요청·응답 계약은 프런트엔드 호환성을 위해 유지

`frontend/`는 이 저장소에 포함되지 않습니다. 프런트엔드는 별도로 실행하고 `CORS_ORIGINS`에 주소를 설정합니다.

## 처음 실행하기

### 준비물

- Node.js `22.12.x` 또는 `24.x` 이상
- pnpm `11.26.0`
- Docker Desktop

저장소 루트(`package.json`이 있는 디렉터리)에서 Docker Desktop이 실행 중인지 확인한 뒤 진행합니다.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:setup
pnpm test
pnpm test:db
pnpm dev
```

PowerShell에서는 `.env` 복사에 다음 명령을 사용합니다.

```powershell
Copy-Item .env.example .env
```

`pnpm db:setup`은 PostgreSQL 시작, 양쪽 데이터베이스 마이그레이션, 기존 Funding 데이터 이관, Prisma Client 생성, 영화 JSON seed를 차례로 실행합니다. 로컬 PostgreSQL은 `127.0.0.1:5435`에 열립니다. `.env`가 이미 있으면 덮어쓰지 말고 연결 값을 확인하세요.

개발 서버 실행 후 `http://localhost:3000/health`에서 서버 상태를 확인할 수 있습니다. `/health` 응답은 HTTP 서버 상태만 확인하며 DB 연결 검사는 `pnpm test:db`로 합니다.

## 다음 작업일부터

```bash
pnpm db:up
pnpm dev
```

서버는 `Ctrl+C`로 종료합니다. 직접 실행할 때는 `pnpm start`를 사용합니다. PostgreSQL 컨테이너를 멈출 때는 `pnpm db:down`을 사용하며, named volume의 DB 데이터는 유지됩니다.

## 환경변수

`.env.example`에 로컬 개발용 기본값이 있습니다.

| 변수 | 용도 |
|---|---|
| `DATABASE_URL` | `cinefund` Movie DB 연결 주소 |
| `FUNDING_DATABASE_URL` | `funding` Funding DB 연결 주소 |
| `PORT` | Express 포트. 생략하면 `3000` |
| `CORS_ORIGINS` | 브라우저 요청을 허용할 Origin 목록. 여러 주소는 쉼표로 구분 |
| `TMDB_API_KEY` 또는 `TMDB_API_TOKEN` | 담당자가 영화 목록을 다시 선정할 때만 사용. 일반 실행과 `db:seed`에는 필요 없음 |

`.env`와 실제 TMDB 키는 커밋하지 않습니다. 공유 가능한 예시 파일인 `.env.example`만 저장소에 둡니다. TMDB 키가 필요한 `pnpm movies:select`는 기존 JSON을 덮어쓰지 않으며, 재선정은 팀 합의 후에만 진행합니다.

## 데이터베이스 구조

| 데이터베이스 | 테이블 | 역할 |
|---|---|---|
| `cinefund` | `movies` | 영화 메타데이터, TMDB 원본 제작비(USD) |
| `funding` | `fundings` | 익명 모의 펀딩 기록, 금액(KRW), 코멘트, 비밀번호 해시 |

두 데이터베이스는 동일한 로컬 PostgreSQL 컨테이너 안에 있지만 서로 다른 DB입니다. DB 간 외래 키는 없으며 API가 Movie DB에서 영화 존재를 확인한 뒤 Funding을 `movieId`로 연결합니다. 누적 펀딩액은 Funding 원장의 금액을 합산해 API 응답에서 제공합니다. Movie DB에는 별도 누적액 캐시를 저장하지 않습니다.

기존 `cinefund.fundings` 테이블이 있는 환경에서 `pnpm db:migrate`는 Funding DB schema를 적용하고 데이터를 이관·검증한 다음 Movie DB의 legacy Funding 테이블과 누적액 컬럼을 제거합니다. 일반 팀원은 공유된 migration을 적용하고, `pnpm db:seed`는 고정 JSON으로 Movie DB만 갱신합니다. Funding 기록은 seed 대상이 아닙니다.

기존 볼륨의 DB 데이터를 지울 수 있는 `docker compose down -v`나 `prisma migrate reset`은 실행하지 마세요.

## API

기본 주소는 `http://localhost:3000`입니다.

| Method | 경로 | 설명 |
|---|---|---|
| `GET` | `/health` | 서버 상태 확인 |
| `GET` | `/api/movies` | 영화 목록, 제목 검색(`q`), 정렬, cursor 페이지네이션 |
| `GET` | `/api/movies/:movieId` | 영화 상세 |
| `GET` | `/api/movies/:movieId/comments` | 영화별 코멘트 목록 |
| `POST` | `/api/movies/:movieId/fundings` | 익명 모의 펀딩 생성 |
| `POST` | `/api/fundings/:fundingId/cancel` | 비밀번호 확인 후 모의 펀딩 취소 |
| `PATCH` | `/api/fundings/:fundingId/comment` | 비밀번호 확인 후 코멘트 수정 |
| `POST` | `/api/comparisons` | 2~5편 비교 정보 조회 |

목록 예시:

```bash
curl 'http://localhost:3000/api/movies?limit=10'
curl 'http://localhost:3000/api/movies?limit=10&sortBy=amount&order=desc'
curl 'http://localhost:3000/api/movies/1/comments'
```

API 응답의 금액 `BigInt`는 정확도를 보존하기 위해 10진 문자열입니다. 공통 오류 응답은 `{ "error": { "code": "...", "message": "..." } }` 형식입니다. 입력 필드, 검증 규칙 및 응답 상세는 [`docs/API_SPEC.md`](docs/API_SPEC.md)를 참고하세요.

## 개발 명령어

| 명령 | 용도 |
|---|---|
| `pnpm db:setup` | 새 로컬 환경 전체 준비: DB 시작, migration, client 생성, seed |
| `pnpm db:up` / `pnpm db:down` | PostgreSQL 시작 / 중지 |
| `pnpm db:migrate` | 커밋된 Movie/Funding migration 적용 및 기존 Funding 데이터 이관 |
| `pnpm db:generate` | Movie/Funding Prisma Client 생성 |
| `pnpm db:seed` | `data/movieDetails.json`으로 Movie DB seed |
| `pnpm test` | DB 없이 실행하는 Node.js 테스트. `API_BASE_URL` 미설정 시 HTTP 통합 테스트는 건너뜀 |
| `pnpm test:db` | PostgreSQL 연결 및 고정 영화 100편 검증 |
| `pnpm dev` | 개발 서버 실행 및 `src/` 파일 감시 |
| `pnpm start` | 서버 직접 실행 |
| `pnpm exec prisma studio` | Movie DB 데이터 조회 |
| `pnpm movies:select` | 담당자용 TMDB 영화 재선정 도구 |

`pnpm test:db`는 DB가 실행되고 migration과 seed가 적용된 환경에서 실행합니다. HTTP 통합 테스트는 `API_BASE_URL`을 지정했을 때 실행되며, 별도로 실행 중인 API 서버와 DB 데이터가 필요합니다.

## 디렉터리 구조

```text
data/                       고정 영화 상세 JSON
docker/init/                 새 PostgreSQL 볼륨의 Funding DB 초기화
docs/                        프로젝트·API·DB·아키텍처 문서
prisma/
  schema.prisma              Movie DB Prisma schema
  migrations/                Movie DB migration
  funding/schema.prisma       Funding DB Prisma schema
  funding/migrations/         Funding DB migration
  seed.js                     영화 JSON seed
  migrate-fundings.js         기존 펀딩 데이터 이관 및 검증
src/
  config/                     DB·서버 설정과 제한값
  errors/                     애플리케이션 오류
  middlewares/                CORS·오류·404 처리
  movies/                     TMDB 선정과 영화 데이터 검증
  repositories/               Prisma 쿼리와 트랜잭션
  routes/                     HTTP 경로와 요청/응답 연결
  services/                   도메인 흐름과 규칙
  utils/                      응답 변환·cursor·정렬
  validators/                 요청 입력 검증
tests/                        단위 및 선택적 HTTP 통합 테스트
compose.yaml                  로컬 PostgreSQL 18
```

상세 설계는 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), DB 필드는 [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md), 검증 시나리오는 [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md)에 있습니다.
