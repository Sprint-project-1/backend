# API 명세 초안

> 이 문서는 **React ↔ CineFund 백엔드** 간 내부 API 초안이다. TMDB API를 앱 실행 중 호출하는 계약은 필요하지 않으며 이 문서에 포함하지 않는다. TMDB는 최초 `movies:select`에서 100편의 메타데이터를 수집하고 `data/movieDetails.json`에 저장한다. 별도 `db:seed`가 이 파일을 PostgreSQL에 적재한다. 아래 경로는 모두 제안이며 팀/API 담당자 확정 전 계약이 아니다. 가입/로그인 API는 없다. 펀딩은 비로그인·무결제 모의 기능이며 참여 입력/수정 UI와 서버 API의 세부 계약은 별도 합의가 필요하다.

> 구현 구분: 이전 확인한 GitHub `main`에는 React Router FE scaffold가 있었다. **이 ZIP**의 백엔드에는 Express 5.3.0과 `GET /health`만 실제 구현되어 있다. 아래 `/api/...` 경로는 **전부 제안(미구현)**이며 팀/API 담당자 확정 전 계약이 아니다. 이 ZIP의 BE 코드가 팀 `main`에 병합되었는지는 별도 확인한다. 현재 FE 경로(`/`, `/detail`, `/compare`, `/compare-result`, `/ranking`)와 기획 경로 차이는 [PAGE_SPEC](PAGE_SPEC.md) 참조.

## 공통 규칙

- 성공 응답은 JSON. 오류는 `{ "error": { "code": "VALIDATION_ERROR", "message": "입력값을 확인해 주세요.", "details": [] } }` 형식 제안.
- 페이지 응답: `{ "items": [], "page": { "nextCursor": "opaque-token-or-null", "hasMore": true } }`.
- 목록 기본 `limit=20`, 최대 50 제안. 코멘트는 항상 10개씩.
- cursor는 안정적인 정렬을 포함한 불투명 토큰을 제안한다. 랜덤 기본 순서 유지 방식 TBD.
- 영화 응답 필드 **제안**: `movieId`, `tmdbId`, `title`, `originalTitle`, `koreanCertification`, `posterPath`, `overview`, `director`, `actors`, `releaseDate`, `genres`, `tagline`, `productionBudget`, `totalFundedAmount`. 모두 현재 Prisma Movie에 존재하지만 서비스 API는 미구현이며 응답 필드 확정 전이다. TMDB 제작비는 USD 원본, 후원액·누적액은 KRW로 관리한다. 선정용 고정 환율 1,400은 최소 제작비 조건에만 사용한다. 목표 펀딩액 필드가 없으므로 달성률은 산정하거나 응답하지 않는다.
- 펀딩 응답 필드 **제안**: `fundingId`, `movieId`, `nickname`, `amount`, `comment`, `createdAt` (`updatedAt`은 수정 응답에 사용 가능). 비밀번호/해시는 응답 금지.
- Prisma `BigInt` 필드(`productionBudget`, `totalFundedAmount`, `Funding.fundingId`, `Funding.amount`)는 현재 `src/app.js`의 Express JSON replacer에서 **문자열**로 직렬화된다. 따라서 아래 **응답 예시**는 `"10000"`처럼 문자열을 사용한다. 반면 `Movie.movieId`, `Movie.tmdbId`, `Funding.movieId`는 Int라 JSON 숫자다. **펀딩 요청 본문**의 금액 타입은 예시일 뿐 최종 계약이 아니다.

### DB ↔ Prisma ↔ API 필드 이름 (응답 초안)

| PostgreSQL 컬럼 | Prisma | API 응답 후보 / 참고 |
|---|---|---|
| `movie_id` | `movieId` (Int) | `movieId` — **내부** 영화 ID |
| `tmdb_id` | `tmdbId` (Int) | `tmdbId` — **외부 TMDB** 영화 ID (다른 값) |
| `original_title` | `originalTitle` (String?) | `originalTitle` |
| `korean_certification` | `koreanCertification` (String?) | `koreanCertification` |
| `poster_path` / `overview` / `director` | `posterPath` / `overview` / `director` | 같은 이름으로 제안 |
| `actors` | `actors` (String[]) | `actors` (문자열 배열) |
| `production_budget` | `productionBudget` (BigInt?) | `productionBudget` (**문자열 또는 null**) |
| `total_funded_amount` | `totalFundedAmount` (BigInt) | `totalFundedAmount` (**문자열**) |
| `funding_id` | `fundingId` (BigInt) | `fundingId` (**문자열**), `Movie.movieId`와 다른 PK |
| `amount` | `amount` (BigInt) | `amount` (**문자열**) |
| `created_at` / `updated_at` | `createdAt` / `updatedAt` (DateTime) | ISO 날짜 문자열 제안 |

> Prisma/DB의 타입을 바꾸는 것이 아니라 API 직렬화 방식만 구분한 것이다. 경로와 응답 구조는 팀 확정 전까지 제안이다.

## 현재 구현된 확인용 엔드포인트

- `GET /health` → `200` JSON `{ "message": "서버 정상 작동!" }`. Express 서버 실행 확인용이며 **DB 연결 확인용은 아님**. DB는 `pnpm test:db`로 별도 검증한다.

## 엔드포인트 제안 (아래 모두 미구현)

| Method / Path | 목적 |
|---|---|
| GET `/api/movies` | 목록 및 정렬/페이지네이션 |
| GET `/api/movies/{movieId}` | 상세 및 펀딩 현황 |
| POST `/api/comparisons` | 2~5개 영화 비교 데이터 조회(상태 저장 없이 요청 본문 전달) |
| POST `/api/movies/{movieId}/fundings` | 제안: 비로그인 모의 펀딩 참여 입력 제출 (요구/API 합의 필요) |
| GET `/api/movies/{movieId}/comments` | 제안: 최신 코멘트 10개씩 조회 (페이지 방식 합의 필요) |
| PATCH `/api/fundings/{fundingId}/comment` | 제안: 비밀번호 검증 후 코멘트 수정 (권한/API 합의 필요) |

### 목록 / 정렬

`GET /api/movies?limit=20&cursor=...&sortBy=amount&order=desc`

`sortBy`: `amount`; `order`: `asc` 또는 `desc`. 정렬을 지정하지 않으면 기본 랜덤(요청 간 일관성 방식 TBD). 정렬 시 랜덤은 적용하지 않는 안을 제안하며 동률 tie-breaker는 `movieId`다. 달성률 기준 정렬은 목표액 산정 정책이 정해질 때까지 제공하지 않는다.

```json
{
  "items": [{
    "movieId": 101, "tmdbId": 550, "title": "Example",
    "originalTitle": "Example", "koreanCertification": "15",
    "posterPath": null, "overview": null, "director": null,
    "actors": ["배우 A", "배우 B"],
    "releaseDate": "2020-01-01", "genres": ["Drama"],
    "tagline": null, "productionBudget": "1000000",
    "totalFundedAmount": "25000"
  }],
  "page": { "nextCursor": "opaque", "hasMore": true }
}
```

> 예시에서 `productionBudget`은 USD, `totalFundedAmount`는 KRW다. 별도 펀딩 목표액이 없으므로 달성률 필드는 포함하지 않는다. 실제 API는 아직 구현되지 않았다.

### 상세 조회

`GET /api/movies/101` 응답 제안: `{ "movie": { ...영화 필드 }, "comments": { "items": [], "page": { "nextCursor": null, "hasMore": false } } }`. 실제 초기 코멘트는 상세와 별도 조회해도 된다(TBD).

### 비교

`POST /api/comparisons` body: `{ "movieIds": [101, 102] }`. 성공: `{ "items": [ { ...영화 필드 } ] }`. 2~5개, 중복 금지. 선택 보존을 위해 URL query 전달은 FE 제안이며 데이터가 너무 길면 요청 API 방식을 택한다.

### 모의 펀딩 참여 등록 (제안 요청/응답)

`POST /api/movies/101/fundings`

```json
{ "amount": 10000, "nickname": "영화팬", "comment": "기대돼요", "password": "user-entered-secret" }
```

응답 `201` **제안**: `{ "funding": { "fundingId": "9001", "movieId": 101, "nickname": "영화팬", "amount": "10000", "comment": "기대돼요", "createdAt": "2026-10-11T12:00:00Z" }, "totalFundedAmount": "35000" }`. 금액 상·하한은 TBD이고 통화는 KRW다. 닉네임 ≤8, 코멘트 ≤100, 비밀번호 최소 기준은 보안 합의 필요.

### 코멘트 조회 및 수정 (제안 요청/응답)

`GET /api/movies/101/comments?limit=10&cursor=...` — `limit`은 제안상 10 고정. 응답은 공통 페이지 형식.

`PATCH /api/fundings/9001/comment` body: `{ "password": "user-entered-secret", "comment": "수정한 내용" }`. 성공 응답 **제안**: `{ "funding": { "fundingId": "9001", "comment": "수정한 내용", "updatedAt": "2026-10-11T12:30:00Z" } }`.

## 상태 코드 및 검증

| 코드 | 사용 |
|---|---|
| 200 | 조회/수정 성공 |
| 201 | 펀딩 등록 성공 |
| 400 | 잘못된 형식/범위/비교 개수 |
| 401 또는 403 | 비밀번호 불일치 (팀 결정; 정보 노출 최소화) |
| 404 | 영화/펀딩 없음 |
| 409 | 충돌/무결성 충돌 |
| 429 | 요청 제한 |
| 500/503 | CineFund 서버/DB 오류 |

**서비스 API 구현 시** 서버에서 모든 입력을 재검증해야 한다. ID 정수/존재, cursor 형식, sort enum, 고유 movieIds, 닉네임 8자, 코멘트 100자, 양의 정수 amount 및 비밀번호 형식을 확인한다. 오류 메시지에 해시/SQL/stack을 포함하지 않는다. 현재 `/health`에는 서비스 입력 검증이 없다.

## TMDB 초기 데이터 적재와 내부 API 경계

- TMDB 요청은 **`pnpm movies:select`로 JSON을 처음 선정할 때만** 수행한다. `pnpm db:seed`는 JSON만 읽으며 TMDB 키가 필요 없다. 사용자 브라우저나 각 영화 화면 요청이 TMDB에 직접 접근하지 않는다.
- 내부 서버 API는 DB에 저장된 영화 목록/상세/펀딩/비교 데이터를 React에 전달하므로 계속 필요하다. DB 접속정보를 브라우저에 노출하지 않는다.
- `data/movieDetails.json`에 고정된 영화 100편의 `tmdbId`와 제목, 감독, 장르, 포스터 경로, 한국 관람등급, 제작비 등 상세 메타데이터가 같이 담겨 있다. 별도 `prisma/seed-movie-ids.json`은 사용하지 않는다.
- `prisma/seed.js`는 JSON으로 영화를 **upsert**하고 기존 `totalFundedAmount`·Funding 기록은 보존한다. DB에 고정 목록 외 영화가 있으면 중단한다. JSON이 있을 때 `movies:select`는 덮어쓰기를 차단한다. 재선정/갱신 책임·주기는 TBD다.
- TMDB 키 오류·호출 제한·네트워크 장애는 앱의 매 요청 문제가 아니라 영화 재선정(`movies:select`) 실행 중 발생한다. 오류를 점검한 뒤 JSON의 재선정 여부를 팀에서 결정한다.

## Figma 추가 항목 및 API 담당자 확인

- 로그인/회원가입은 Figma 및 현재 서비스 범위에 없다. 익명 펀딩 입력은 계정 등록과 다른 UI이며, 이 문서의 POST는 API 담당자와 정리할 제안이다.
- 상세의 펀딩 취소 팝업이 실제 제출 취소 확인인지 단순 모달 닫기인지 시안 상호작용을 확인해야 한다. 펀딩 기록 취소/삭제 API는 현재 제안에 포함하지 않는다.

- 홈 헤더/비교 선택 화면의 영화 검색은 UI만 확인됐다. 검색 endpoint, query parameter, 검색 대상 100편 범위는 TBD이며 현재 계약에 포함하지 않는다.
- 비교 결과 시안의 `overview`(설명), `director`(감독), `posterPath`(포스터)는 **이미 TMDB JSON과 Prisma Movie에 저장 대상**이다. 비교 API에 어떤 필드를 반환할지는 팀/API 합의 후 확정한다.
- AI 비교 요약은 기존 기획 외 시안 요소로, endpoint/provider를 정하지 않았다.
- 상세 시안은 코멘트 페이지 번호를 표시하지만 초안은 cursor다. 백엔드 page/offset 또는 FE page-to-cursor 매핑 중 하나를 선택해 계약을 통일해야 한다.
- 펀딩/코멘트는 로그인·실결제 없는 모의 기능이다. 요청·응답/상태 코드의 구체 계약은 API 담당자 작성본과 팀 합의 후 확정한다.
