# CineFund 백엔드 변경 사항

이 문서는 기존 백엔드 구조와 현재 구조의 차이를 설명합니다. 프런트엔드가 사용하는 API 계약은 유지하고, 펀딩 데이터 저장 구조와 서버 구현을 변경했습니다.

## 변경 요약

| 구분 | 기존 | 현재 |
|---|---|---|
| PostgreSQL | `cinefund` 데이터베이스 하나 | PostgreSQL 컨테이너 하나 안에 `cinefund`와 `funding` 데이터베이스 사용 |
| 영화 데이터 | `cinefund.movies` | `cinefund.movies`에 유지 |
| 펀딩 원장 | `cinefund.fundings` | 별도 `funding.fundings`에 저장 |
| 영화별 누적액 | `movies.total_funded_amount`에 캐시 | 펀딩 원장에서 `movieId`별로 집계 |
| DB 연결 | Prisma schema/client 하나 | Movie와 Funding 전용 schema/client 각각 사용 |
| DB 간 관계 | 같은 DB 내 외래 키 사용 가능 | DB 간 외래 키가 없어 API에서 영화 존재를 확인하고 `movieId`로 연결 |

`funding`은 두 번째 데이터베이스의 이름입니다. 별도의 Docker 컨테이너를 추가하지 않고, 현재 로컬 PostgreSQL 컨테이너 안에 논리 DB 두 개를 둡니다.

## 데이터와 마이그레이션

기존 데이터베이스에 펀딩 기록이 있는 환경에서는 `pnpm db:migrate`가 다음 순서로 처리합니다.

1. `funding` 데이터베이스가 없으면 생성합니다.
2. Funding schema migration을 적용합니다.
3. 기존 `cinefund.fundings`의 기록을 `funding.fundings`로 이관하고 기록 ID를 보존합니다.
4. 이관 내용과 기존 누적액의 일치를 확인합니다.
5. Movie DB에서 기존 펀딩 테이블과 누적액 캐시 컬럼을 제거합니다.

이후 `pnpm db:seed`는 `data/movieDetails.json`으로 Movie DB만 갱신하며 Funding 원장에는 접근하지 않습니다. 로컬 `.env`에는 다음처럼 두 연결 주소를 지정합니다.

```dotenv
DATABASE_URL="postgresql://cinefund:cinefund_local@127.0.0.1:5435/cinefund?schema=public"
FUNDING_DATABASE_URL="postgresql://cinefund:cinefund_local@127.0.0.1:5435/funding?schema=public"
```

## API 영향

기존 프런트엔드가 사용하는 경로, 요청 형식, 응답 필드와 오류 형식은 변경하지 않았습니다. 영화 목록·상세·비교 응답의 `totalFundedAmount`는 이제 Funding DB의 원장 합계로 만들어 반환합니다. 프런트엔드는 계속 백엔드 API만 호출하고 DB에 직접 연결하지 않습니다.

모의 펀딩 생성·취소와 코멘트 수정은 기존 API 계약에 맞춰 서버에 구현되어 있으며 실제 결제나 사용자 계정은 추가하지 않았습니다. API 계약의 기준 문서는 [`docs/API_SPEC.md`](docs/API_SPEC.md)입니다.

## 현재 구성 파일

서버 코드는 요청 경계와 데이터 접근을 분리합니다.

| 디렉터리 | 책임 |
|---|---|
| `src/routes/` | HTTP 경로, 요청 파싱, 상태 코드 |
| `src/validators/` | 영화·펀딩·비교 요청 검증 |
| `src/services/` | 도메인 흐름과 규칙 |
| `src/repositories/` | Prisma 쿼리와 트랜잭션 |
| `src/config/` | DB/서버 설정과 공통 제한값 |
| `src/utils/` | 응답 직렬화, cursor, 페이지 정렬 |

- `prisma/schema.prisma`: Movie DB schema
- `prisma/funding/schema.prisma`: Funding DB schema
- `prisma/migrations/`: Movie DB migration 이력
- `prisma/funding/migrations/`: Funding DB migration 이력
- `prisma/ensure-funding-database.js`: Funding DB 존재 확인 및 생성
- `prisma/migrate-fundings.js`: 기존 펀딩 원장 이관 및 검증
- `docker/init/`: 새 PostgreSQL 볼륨 초기화 시 Funding DB 생성
- `.env.example`: 로컬 Movie/Funding DB 연결 설정 예시

DB를 올리고 두 schema의 migration 및 Prisma Client를 반영할 때는 `pnpm db:up`, `pnpm db:migrate`, `pnpm db:generate`를 사용합니다. API 경로와 필드 계약을 수정해야 하는 경우에는 프런트엔드와 합의한 뒤 기준 문서도 함께 갱신합니다.
