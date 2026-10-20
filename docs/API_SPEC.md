# CineFund API 명세

> **상태: 프런트엔드·백엔드 구현 기준 제안, 2026-10-19.** 현재 문서상 서버에서 구현된 경로는 `GET /health`뿐이다. 아래 `/api` 계약은 페이지 담당자 초안을 통합한 구현 기준이다. 실제 결제, 로그인, 회원가입은 포함하지 않는다.

## 1. 공통 계약

### 범위와 데이터 흐름

- 브라우저는 백엔드 API만 호출하며, PostgreSQL은 백엔드가 Prisma로 접근한다.
- 지정 영화 100편은 TMDB에서 초기 적재한 DB 데이터를 사용한다. 사용자 페이지 요청에서 TMDB에 다시 요청하지 않는다.
- API의 `movieId`는 CineFund DB 내부 ID다. `tmdbId`는 외부 TMDB ID이며 두 값을 혼용하지 않는다.
- API 경로 prefix는 `/api`를 사용한다. JSON 본문을 주고받으며 JSON 응답의 `Content-Type`은 `application/json`이다.
- 모든 시간은 ISO 8601 UTC 문자열, 영화 개봉일은 `YYYY-MM-DD` 문자열로 반환한다. 날짜가 없으면 `null`이다.
- Prisma `BigInt`는 JSON에서 정확도를 잃지 않도록 10진 문자열로 반환한다. 금액을 JavaScript 부동소수점으로 변환하지 않는다.

### 금액과 달성률

- `productionBudget`에는 TMDB `budget` 숫자를 환율 변환 없이 저장한다. 팀 화면 규칙에 따라 목표액 표시는 이 숫자와 동일한 숫자를 KRW로 표시한다. 예: `"225000000"` → `₩225,000,000`. 환율 계산은 하지 않는다.
- `totalFundedAmount`는 누적 모의 펀딩액이며 KRW 단위의 정수 문자열이다. 아직 펀딩 기록이 없으면 `"0"`이다.
- `fundingGoal`은 응답하지 않는다. 화면에서 목표액을 표시할 때 `productionBudget` 숫자를 사용한다.
- 달성률은 `totalFundedAmount / productionBudget × 100`으로 계산한다. `productionBudget`이 `null` 또는 0이면 달성률은 계산 불가로 처리한다. 이 값은 별도 API 필드가 아니다.
- `productionBudget`은 원본 TMDB 제작비 값이면서 위 팀 표시 규칙에 따라 같은 숫자가 원화 목표액으로도 쓰인다. 화면 문구에서는 제작비와 목표액의 의미를 구분한다.

### 공통 영화 응답 모델

목록, 상세, 비교 응답은 아래 필드명과 타입을 공유한다. 목록 화면이 쓰지 않는 필드도 `null` 가능 필드는 일관성을 위해 포함한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `movieId` | integer | CineFund 내부 ID |
| `tmdbId` | integer | TMDB 외부 ID |
| `title` | string | 한국어 제목 |
| `originalTitle` | string \| null | 원제 |
| `koreanCertification` | string \| null | 한국 관람 등급 |
| `posterPath` | string \| null | 포스터 경로. 전체 URL이 아님 |
| `overview` | string \| null | 줄거리 |
| `director` | string \| null | 감독 |
| `actors` | string[] | 출연진. 값이 없으면 빈 배열 |
| `releaseDate` | string \| null | 개봉일 (`YYYY-MM-DD`) |
| `genres` | string[] | 장르. 값이 없으면 빈 배열 |
| `tagline` | string \| null | 태그라인 |
| `productionBudget` | decimal string \| null | TMDB `budget` 원본 정수 |
| `totalFundedAmount` | decimal string | 누적 모의 펀딩액. 없으면 `"0"` |

포스터 URL 조합은 프런트엔드가 TMDB 이미지 base URL과 `posterPath`를 사용한다. `posterPath`가 `null`이면 대체 이미지를 표시한다.

### 공통 오류 응답

오류는 다음 형식으로 반환하며 내부 경로, SQL, stack trace, 비밀 값은 노출하지 않는다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 값을 확인해 주세요."
  }
}
```

| HTTP 상태 | 코드 | 사용 상황 |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | 잘못된 query, path, body 값 |
| 403 | `INVALID_CREDENTIAL` | 펀딩 취소 또는 코멘트 수정 비밀번호 불일치 |
| 404 | `MOVIE_NOT_FOUND` | 상세/코멘트/펀딩 대상 영화가 없거나 비교 요청의 영화 ID 일부가 없음 |
| 404 | `FUNDING_NOT_FOUND` | 취소 또는 코멘트 수정 대상 기록이 없음 |
| 500 | `INTERNAL_ERROR` | 예기치 않은 서버 오류 |
| 503 | `SERVICE_UNAVAILABLE` | DB 등 필수 의존 서비스를 사용할 수 없음 |

### 구현 상태

| Method | Path | 상태 | 기능 |
|---|---|---|---|
| `GET` | `/health` | 구현됨 | 서버 상태 확인 |
| `GET` | `/api/movies` | 미구현 | 영화 목록·제목 검색·정렬·페이지네이션 |
| `GET` | `/api/movies/{movieId}` | 미구현 | 영화 상세 조회 |
| `GET` | `/api/movies/{movieId}/comments` | 미구현 | 영화별 코멘트 조회 |
| `POST` | `/api/movies/{movieId}/fundings` | 미구현 | 익명 모의 펀딩 생성 |
| `POST` | `/api/fundings/{fundingId}/cancel` | 미구현 | 비밀번호 검증 후 모의 펀딩 취소 |
| `PATCH` | `/api/fundings/{fundingId}/comment` | 미구현 | 비밀번호 검증 후 코멘트 수정 |
| `POST` | `/api/comparisons` | 미구현 | 2~5편 비교 정보 조회 |

## 2. 페이지와 API 연결

| 페이지 | API 호출 |
|---|---|
| 홈 `/` | 목록 `GET /api/movies?limit=10`; 펀딩 Top 3 `GET /api/movies?limit=3&sortBy=amount&order=desc` |
| 영화 탐색/검색 | `GET /api/movies?limit=10`, 필요하면 `q` 및 `cursor` 추가 |
| 영화 상세 | `GET /api/movies/{movieId}`; 코멘트 `GET /api/movies/{movieId}/comments`; 모의 펀딩 `POST /api/movies/{movieId}/fundings`; 취소 `POST /api/fundings/{fundingId}/cancel`; 코멘트 수정 `PATCH /api/fundings/{fundingId}/comment` |
| 비교 선택 | 후보 검색/조회에 `GET /api/movies` 사용; 선택 상태는 프런트엔드에서 관리 |
| 비교 결과 | `POST /api/comparisons` |
| 펀딩 랭킹 | `GET /api/movies?limit=10&sortBy=amount&order=desc` 또는 `order=asc`; 달성률 정렬은 `sortBy=achievementRate` |

## 3. 영화 목록 조회

`GET /api/movies`

홈, 영화 탐색, 비교 선택 후보, 랭킹이 공유한다. 결과 범위는 DB에 적재된 지정 영화 100편이다.

### Query parameters

| 이름 | 타입 | 필수 | 규칙 |
|---|---|---:|---|
| `limit` | positive integer | 아니요 | 기본 20, 최대 50. 영화 탐색/랭킹 화면은 `limit=10`, 홈 Top 3는 `limit=3`을 보낸다. |
| `cursor` | opaque string | 아니요 | 이전 응답의 `page.nextCursor`를 그대로 전달한다. 첫 페이지에서는 생략한다. |
| `q` | string | 아니요 | 제목 검색 전용. 앞뒤 공백을 제거하고, 공백만 있으면 검색 조건이 없는 것으로 처리한다. 제목에 검색어가 포함되는지 대소문자 구분 없이 검사한다. 연도·장르·원제는 검색하지 않는다. |
| `sortBy` | enum | 아니요 | `amount` 또는 `achievementRate`. 생략하고 `q`도 없으면 랜덤 목록, `q`만 있으면 제목 오름차순 결과를 반환한다. |
| `order` | enum | 아니요 | `asc` 또는 `desc`. `sortBy`가 있을 때만 사용할 수 있으며, 생략하면 `desc`다. |

`sortBy`가 없고 `order`만 전달되면 400을 반환한다. `limit`은 1~50의 정수만 허용한다. 검색어/정렬/페이지 크기가 달라지면 기존 cursor를 재사용하지 않고 첫 페이지부터 요청한다.

### 정렬 및 cursor 규칙

- `sortBy=amount`는 `totalFundedAmount` 기준이다.
- `sortBy=achievementRate`는 `totalFundedAmount / productionBudget × 100` 기준이다. `productionBudget`이 `null` 또는 0인 영화는 두 방향 모두 결과 뒤에 둔다.
- 금액 또는 달성률이 같으면 `movieId` 오름차순으로 정렬한다. 제목 검색 기본 정렬은 `title` 오름차순, 제목이 같으면 `movieId` 오름차순이다.
- 검색과 명시적 정렬이 없는 첫 요청에서는 100편의 순서를 한 번 무작위로 만든다. 응답 cursor는 그 순서의 다음 위치와 해당 요청의 필터/정렬 조건을 보존한다. 후속 페이지에서 순서를 다시 섞지 않는다.
- cursor는 불투명한 값이며 클라이언트가 생성·해석하지 않는다. cursor의 요청 조건이 현재 query와 맞지 않거나 유효하지 않으면 400을 반환한다.
- 마지막 페이지는 `nextCursor: null`, `hasMore: false`다. 다음 항목이 없을 때 빈 페이지를 추가로 반환하지 않는다.
- 이 API는 페이지 번호 대신 cursor를 사용한다. 영화 탐색 UI는 페이지별 cursor를 메모리에 보관해 번호형 페이지 컨트롤을 연결한다. 방문하지 않은 페이지 번호로 바로 이동할 수 없으며, 검색어·정렬·페이지 크기가 바뀌면 페이지와 cursor 캐시를 초기화한다.

### 요청 예시

```http
GET /api/movies?limit=10
GET /api/movies?limit=10&cursor=OPAQUE_CURSOR
GET /api/movies?limit=10&q=%EA%B8%B0%EC%83%9D%EC%B6%A9
GET /api/movies?limit=10&sortBy=amount&order=desc
GET /api/movies?limit=10&sortBy=achievementRate&order=asc
```

### 응답 예시 (200)

```json
{
  "items": [
    {
      "movieId": 1,
      "tmdbId": 969681,
      "title": "스파이더맨: 브랜드 뉴 데이",
      "originalTitle": "Spider-Man: Brand New Day",
      "koreanCertification": "12",
      "posterPath": "/example.jpg",
      "overview": "영화 줄거리",
      "director": "감독 이름",
      "actors": ["배우 이름"],
      "releaseDate": "2026-07-29",
      "genres": ["SF", "액션", "모험"],
      "tagline": "영화 태그라인",
      "productionBudget": "225000000",
      "totalFundedAmount": "0"
    }
  ],
  "page": {
    "nextCursor": "OPAQUE_CURSOR",
    "hasMore": true
  }
}
```

검색 결과가 없으면 `200`과 빈 `items`, `nextCursor: null`, `hasMore: false`를 반환한다.

### 홈 Top 3 및 랭킹

별도 endpoint 없이 같은 목록 조회를 재사용한다.

```http
GET /api/movies?limit=3&sortBy=amount&order=desc
GET /api/movies?limit=10&sortBy=amount&order=desc
GET /api/movies?limit=10&sortBy=amount&order=asc
```

Top 3와 랭킹은 누적 펀딩액을 기준으로 한다. 동률은 `movieId` 오름차순이다. 랭킹 화면의 달성률 정렬은 같은 목록 endpoint에 `sortBy=achievementRate`를 보낸다.

## 4. 영화 상세 조회

`GET /api/movies/{movieId}`

`movieId`는 목록 결과의 양의 정수 내부 ID다. FE 라우트에서 해당 ID를 전달해 요청한다.

```http
GET /api/movies/1
```

성공 응답 (200):

```json
{
  "movie": {
    "movieId": 1,
    "tmdbId": 969681,
    "title": "스파이더맨: 브랜드 뉴 데이",
    "originalTitle": "Spider-Man: Brand New Day",
    "koreanCertification": "12",
    "posterPath": "/example.jpg",
    "overview": "영화 줄거리",
    "director": "감독 이름",
    "actors": ["배우 이름"],
    "releaseDate": "2026-07-29",
    "genres": ["SF", "액션", "모험"],
    "tagline": "영화 태그라인",
    "productionBudget": "225000000",
    "totalFundedAmount": "0"
  }
}
```

잘못된 `movieId` 형식은 400, 존재하지 않는 ID는 404다. 응답은 공통 영화 모델을 사용한다.

## 5. 영화 코멘트 조회

`GET /api/movies/{movieId}/comments`

해당 영화의 모의 펀딩 코멘트를 최신순으로 조회한다. 코멘트가 없으면 빈 목록을 반환한다.

### Query parameters

| 이름 | 타입 | 필수 | 규칙 |
|---|---|---:|---|
| `limit` | positive integer | 아니요 | 기본 10, 최대 10 |
| `cursor` | opaque string | 아니요 | 이전 응답의 `page.nextCursor`; 첫 페이지에서는 생략 |

정렬은 `createdAt` 내림차순, 같은 시각이면 `fundingId` 내림차순이다. cursor 페이지 사이에도 이 정렬을 유지한다.

```http
GET /api/movies/1/comments?limit=10
```

성공 응답 (200):

```json
{
  "items": [
    {
      "fundingId": "9001",
      "movieId": 1,
      "nickname": "영화팬",
      "amount": "10000",
      "comment": "기대돼요",
      "createdAt": "2026-10-19T03:00:00.000Z"
    }
  ],
  "page": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

`password`와 `passwordHash`는 응답하지 않는다. 잘못된 `movieId` 형식은 400, 영화가 없으면 404다.

## 6. 익명 모의 펀딩 생성

`POST /api/movies/{movieId}/fundings`

로그인이나 실제 결제 없이 모의 펀딩 기록 한 건을 생성한다. 금액 반영은 서버에서만 수행한다.

요청 본문:

```json
{
  "amount": "10000",
  "nickname": "영화팬",
  "comment": "기대돼요",
  "password": "example-secret"
}
```

- 네 필드는 모두 요청에 포함한다. `amount`, `nickname`, `password`는 비어 있지 않아야 하며 `comment` 빈 값 허용 여부는 TBD다.
- `amount`: 10진 정수 문자열, `1` 이상, PostgreSQL signed `BIGINT` 최댓값 이하. 통화는 KRW다. 소수, 부호, 지수 표기는 허용하지 않는다.
- `nickname`: 앞뒤 공백 제거 후 1~8 Unicode code point.
- `comment`: 문자열, 최대 100 Unicode code point. 빈 코멘트 허용 여부와 앞뒤 공백 처리 규칙은 TBD다.
- `password`: 총 8~12자이며 영문자(`A-Z`, `a-z`)와 숫자(`0-9`)를 각각 하나 이상 포함한다. 펀딩 생성, 취소, 코멘트 수정에서 같은 기준을 적용한다. 생성 시 평문으로 저장·응답·로그에 남기지 않고 검증된 단방향 비밀번호 해시로 저장한다.
- 시안의 동의 체크 항목은 문구와 동의 기록의 필요성이 확정되지 않았다. 의미와 서버 보관 필요성을 정하기 전까지 요청 필드로 간주하지 않는다. 이 항목을 펀딩 생성 필수 조건으로 확정하면 요청에 동의 여부를 추가하고 관련 화면/API 문서를 함께 갱신한다.
- 요청값 검증에 실패하면 400, 해당 영화가 없으면 404다. 빈 코멘트 허용 여부와 앞뒤 공백 처리 규칙은 팀 결정 후 이 계약을 갱신한다.

Funding 원장 생성과 `Movie.totalFundedAmount` 증가는 하나의 DB 트랜잭션에서 처리한다. 누적액 증가는 동시 요청에서도 유실되지 않도록 원자적으로 반영하며, `totalFundedAmount`는 해당 영화 Funding 기록의 금액 합과 일치시킨다. 사용자가 취소를 확인하면 아래 취소 API로 모의 기록을 제거할 수 있다. 실제 결제는 없다.

성공 응답 (201):

```json
{
  "funding": {
    "fundingId": "9001",
    "movieId": 1,
    "nickname": "영화팬",
    "amount": "10000",
    "comment": "기대돼요",
    "createdAt": "2026-10-19T03:00:00.000Z"
  },
  "totalFundedAmount": "35000"
}
```

응답에는 비밀번호와 해시가 포함되지 않는다.

## 7. 펀딩 코멘트 수정

`PATCH /api/fundings/{fundingId}/comment`

로그인 계정 대신 생성 시 설정한 비밀번호를 확인해 해당 기록의 코멘트만 수정한다. 금액·닉네임·영화 연결은 변경하지 않는다.

요청 본문:

```json
{
  "password": "example-secret",
  "comment": "수정한 코멘트"
}
```

두 필드는 모두 필수다. `fundingId`는 양의 정수 ID다. BigInt ID는 경로에서 10진수 문자열로 전달한다. 비밀번호는 영문자와 숫자를 각각 하나 이상 포함한 8~12자여야 하며, 새 `comment`는 최대 100 Unicode code point다. 빈 값 및 코멘트 공백 정규화 규칙은 TBD다. 비밀번호가 틀리면 403 `INVALID_CREDENTIAL`, 기록이 없으면 404 `FUNDING_NOT_FOUND`, 입력 형식이 잘못되면 400을 반환한다. 수정 실패 시 기록은 변경하지 않는다.

성공 응답 (200):

```json
{
  "funding": {
    "fundingId": "9001",
    "movieId": 1,
    "comment": "수정한 코멘트",
    "updatedAt": "2026-10-19T03:30:00.000Z"
  }
}
```

응답 및 로그에 비밀번호나 해시를 포함하지 않는다. 수정 횟수·기간 제한은 두지 않는다.

## 8. 모의 펀딩 취소

`POST /api/fundings/{fundingId}/cancel`

상세 화면의 **펀딩 취소 확인 팝업**에서 `확인`을 눌렀을 때 기존 모의 펀딩 기록을 취소한다. 실제 결제 취소나 환불은 발생하지 않는다. 팝업의 `취소` 버튼과 `×`는 팝업을 닫기만 하며 API를 호출하지 않는다.

요청 본문:

```json
{ "password": "example-secret" }
```

`password`는 필수이며 영문자와 숫자를 각각 하나 이상 포함한 8~12자여야 한다. `fundingId`는 양의 정수 ID를 10진수 경로 문자열로 전달한다. 서버는 저장된 비밀번호 해시를 검증한다. 비밀번호가 틀리면 403 `INVALID_CREDENTIAL`, 기록이 없으면 404 `FUNDING_NOT_FOUND`, 잘못된 ID나 본문이면 400을 반환하며 이때 기록과 누적액은 바뀌지 않는다.

비밀번호가 맞으면 한 DB 트랜잭션에서 해당 Funding 행이 아직 존재하는 경우에만 삭제하고 영화의 `totalFundedAmount`에서 취소 금액을 원자적으로 차감한다. 동시 취소 요청도 실제 삭제에 성공한 한 요청만 차감한다. 코멘트 목록에서도 해당 기록은 더 이상 반환하지 않는다. 이미 취소된 ID는 404를 반환한다.

성공 응답 (200):

```json
{
  "fundingId": "9001",
  "movieId": 1,
  "totalFundedAmount": "25000"
}
```

응답과 로그에는 비밀번호나 해시를 포함하지 않는다. API 성공 후 프런트엔드는 상세·랭킹 누적액을 새 값으로 갱신하고 해당 코멘트를 제거한다.

## 9. 비교 결과 조회

`POST /api/comparisons`

비교 선택에서 받은 2~5개의 영화 ID에 대해 한 번에 공통 영화 모델을 반환한다. 이 endpoint는 선택을 저장하거나 데이터를 변경하지 않는다.

요청 본문:

```json
{ "movieIds": [1, 2, 3] }
```

- `movieIds`는 서로 다른 양의 정수 2~5개여야 한다. 형식 오류, 중복 ID, 개수 범위 오류는 400이다.
- 하나라도 DB에 없는 ID면 전체 요청을 404로 실패시킨다. 일부 항목만 성공 응답으로 반환하지 않는다.
- 성공 응답 `items`는 입력 배열과 동일한 순서를 유지한다.

성공 응답 (200):

```json
{
  "items": [
    {
      "movieId": 1,
      "tmdbId": 969681,
      "title": "영화 제목 A",
      "originalTitle": "Original Title A",
      "koreanCertification": "12",
      "posterPath": "/movie-a.jpg",
      "overview": "영화 설명",
      "director": "감독 이름",
      "actors": ["배우 이름"],
      "releaseDate": "2026-07-29",
      "genres": ["SF", "액션"],
      "tagline": null,
      "productionBudget": "225000000",
      "totalFundedAmount": "25000"
    },
    {
      "movieId": 2,
      "tmdbId": 123456,
      "title": "영화 제목 B",
      "originalTitle": null,
      "koreanCertification": null,
      "posterPath": null,
      "overview": null,
      "director": null,
      "actors": [],
      "releaseDate": null,
      "genres": [],
      "tagline": null,
      "productionBudget": null,
      "totalFundedAmount": "0"
    }
  ]
}
```

목표액/달성률은 별도 필드로 반환하지 않는다. 프런트엔드가 공통 금액 규칙에 따라 표시·계산한다. AI 요약은 이 API 범위가 아니다.

## 10. 비교 선택 상태 전달

- 후보 검색 및 목록은 `GET /api/movies`를 사용한다. 검색은 `q`에 제목 검색어를 전달한다.
- 선택 상태는 서버에 저장하지 않는다. 프런트엔드가 `movieId` 배열을 결과 화면으로 전달한다. 쿠키나 localStorage에 보존하지 않는다.
- 결과 화면은 전달받은 ID로 `POST /api/comparisons`를 호출한다. URL query 사용 여부는 FE 라우팅 구현 선택이며 API 요청 계약에는 영향을 주지 않는다.

## 11. 구현 전제 및 완료 체크

이 문서로 착수할 endpoint는 `GET /api/movies`, `GET /api/movies/{movieId}`, `GET /api/movies/{movieId}/comments`, `POST /api/movies/{movieId}/fundings`, `POST /api/fundings/{fundingId}/cancel`, `PATCH /api/fundings/{fundingId}/comment`, `POST /api/comparisons`다. 홈과 랭킹은 목록 endpoint를 재사용한다. `/health` 외에는 현재 구현 완료로 간주하지 않는다.

- [ ] Prisma 모델/실제 DB와 공통 영화 응답 모델 필드가 일치하는지 확인한다. 필드가 없으면 schema/seed를 먼저 맞춘다.
- [ ] 누적액의 단일 원천을 정하고 목록·상세·비교·랭킹이 같은 값을 반환하게 한다.
- [ ] 기본 랜덤 조회의 순서를 cursor 페이지 간 유지한다.
- [ ] DB 및 영화 seed 100편의 데이터 형식이 정리된 필드와 일치하는지 확인한다.
- [ ] FE가 목록 페이지당 10개를 요청하고, 검색어/정렬이 바뀔 때 cursor를 초기화한다.
- [x] FE의 번호형 페이지 UI는 메모리의 페이지별 cursor 캐시로 연결한다. 다음 페이지 cursor를 저장하고, 검색어·정렬·페이지 크기가 바뀌면 현재 페이지와 cursor 캐시를 초기화한다. 방문하지 않은 페이지로 바로 이동하는 기능은 지원하지 않는다.
- [ ] 펀딩 참여 시안의 동의 체크 문구/기록 필요성을 정하고, 필요하면 생성 요청 계약에 포함한다.
- [x] 펀딩 비밀번호는 영문자와 숫자를 각각 하나 이상 포함한 8~12자로 정하고 생성·취소·코멘트 수정에서 같은 검증을 적용한다.
- [ ] 빈 코멘트 허용 여부와 공백 정규화 규칙을 결정하고 생성/수정 검증을 맞춘다.
- [ ] 익명 펀딩 생성 및 비밀번호 검증 endpoint에 적용할 요청 제한/반복 실패 보호를 보안 정책과 맞춘다.
- [ ] 상세·비교 화면에서 동일한 공통 필드명과 null 처리 규칙을 사용한다.
- [ ] API 구현 및 통합 검증 시 정상·빈 결과·오류·페이지 경계·비교 ID 검증 시나리오를 확인한다.

AI 요약 endpoint는 외부 서비스·비용·데이터 처리 정책이 정해지지 않아 범위에서 제외한다. 펀딩·취소·코멘트 계약은 화면의 입력과 확인 흐름을 기준으로 한 구현 제안이다. 저장소 README의 API 구현 상태 표시는 실제 코드와 일치하도록 구현 PR에서 갱신한다.
