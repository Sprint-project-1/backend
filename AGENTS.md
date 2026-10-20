# CineFund 작업 지침

이 파일은 CineFund 저장소에서 작업하는 개발자와 코딩 에이전트를 위한 공통 지침이다. 팀의 최신 합의가 이 문서나 다른 문서와 다르면 최신으로 기록된 팀 합의를 따른 뒤 관련 문서를 함께 갱신한다.

## 프로젝트 맥락

- CineFund는 코드잇 스프린트 16기 3팀의 영화 모의 펀딩 및 비교 서비스다.
- 현재는 기획 명세와 DB·서버 골격 준비 코드가 함께 있는 단계다. 영화 목록·상세·펀딩 서비스 API는 아직 미구현이다. 실제 결제는 프로젝트 범위 밖이며 모의 펀딩이라는 성격을 유지한다.
- 프런트엔드는 별도로 확인했던 React (JSX), HTML, CSS, JavaScript 기반이다. **이 ZIP 백엔드 폴더**에는 Node.js(패키지 요구 `^22.12.0 || >=24.0.0`), Express 5.3.0(lockfile), Prisma 7.10.0, PostgreSQL 18 및 pnpm 11.26.0 설정이 존재한다. Express에는 `/health`만 구현되어 있으며 영화/펀딩 서비스 API는 미구현이다.
- 이 백엔드의 `compose.yaml`은 Docker 기반 로컬 PostgreSQL 18을 `127.0.0.1:5435`에 연결한다. 팀원별 DB 데이터는 독립적이고 Prisma schema, migration, JSON seed 절차를 공통으로 사용한다. 통합/운영 DB와 배포 방법은 미정이다.
- 브라우저는 백엔드 API와 통신한다. 프런트엔드에서 PostgreSQL에 직접 접속하지 않는다.
- 여기서 백엔드 API는 CineFund 자체의 화면-서버 API다. TMDB 외부 API는 최초 `movies:select`에서 영화 100편을 선정할 때 호출하며, `db:seed`는 고정 JSON만 읽는다. 앱의 사용자 요청마다 TMDB를 호출하지 않는다.
- 지정 영화 100편, 기본 랜덤 목록, 무한 스크롤, 2~5편 비교가 현재 기획의 중심이다.
- 과거 확인한 `Sprint-project-1/cine-fund`의 `main`에는 `client/` 아래 Vite/React JSX 프런트엔드 scaffold와 placeholder 페이지가 있었다. **현재 ZIP의 백엔드 준비 코드가 팀 `main`에 병합되었는지는 이 ZIP만으로 확인할 수 없다.**
- 현재 백엔드 폴더의 패키지 매니저는 `package.json`에 지정된 **pnpm 11.26.0**이다 (`pnpm-lock.yaml`). `pnpm dev`는 Express 서버 실행, `pnpm test`는 Node 내장 단위 테스트이며, 프런트엔드에서도 별도로 `pnpm dev/build/lint/preview` 명령을 사용한다(이전 FE 조사 기준).
- 앞서 확인한 FE `main`의 Vite 설정에는 React plugin, Tailwind CSS Vite plugin, React Compiler Babel preset이 연결되어 있고, ESLint flat config가 존재한다. Prettier/TypeScript는 현재 적용된 구성으로 간주하지 않는다.
- 현재 FE 라우트는 `/`, `/detail`, `/compare`, `/compare-result`, `/ranking`이다. 기획/Figma 경로와 다른 부분은 `docs/PAGE_SPEC.md`에서 관리하고 합의 후 갱신한다.

## 먼저 읽을 문서

작업 범위에 해당하는 문서를 확인하고 관련 문서도 함께 갱신한다.

- 요구사항과 결정 상태: `docs/PROJECT_SPEC.md`, `docs/PRD.md`
- API와 데이터: `docs/API_SPEC.md`, `docs/DATABASE_SCHEMA.md`, `docs/ARCHITECTURE.md`
- UI와 작업 범위: `docs/PAGE_SPEC.md`, `docs/TASK_BREAKDOWN.md`
- 보안과 품질: `docs/SECURITY_POLICY.md`, `docs/TEST_PLAN.md`
- 코드/Git/팀 규칙: `docs/conventions/CODING_CONVENTION.md`, `docs/conventions/GIT_CONVENTION.md`, `docs/conventions/GROUND_RULES.md`

## 결정 상태를 지킨다

- **확정**은 팀이 결정했거나 현재 기획안에 명시된 요구사항만 뜻한다.
- **제안**은 검토할 설계다. 팀 합의 전에는 구현·문서에서 확정 규칙처럼 다루지 않는다.
- **TBD**는 정보가 없거나 팀 결정이 필요한 항목이다. 임의의 기본값으로 채우지 않는다.
- 기술 선택, 일정, 담당자, 경로, 데이터 정책을 추측해 확정하지 않는다. 필요한 결정은 선택지와 영향을 설명하고 문서의 체크리스트에 남긴다.
- 문서 사이에 충돌이 있으면 가장 최근의 명시적 팀 결정을 우선하고, 충돌한 문서를 함께 정리한다.

## 인증과 익명 기능

- 회원가입/로그인은 현재 계획에 포함되지 않는다. **익명 펀딩 기록 생성**은 계정 등록과 다른 기능이다.
- 비로그인 모의 펀딩은 서비스 목표다. 실제 결제, 결제 후 펀딩, 결제 정보 수집은 범위에 없다. 구체적인 등록 요청/검증/오류 및 수정 권한 계약은 API 담당자와 합의 전까지 제안으로 표시한다.
- 모의 펀딩 금액 반영은 백엔드에서만 처리한다.
- 코멘트 수정용 비밀번호를 쓰기로 합의한다면 평문 저장·로그·응답을 금지하고 검증된 해시를 사용한다. 로그인 기능이 있는 것처럼 표현하지 않는다.
- 쿠키와 localStorage를 사용자 상태 저장에 사용하지 않기로 한 합의를 존중한다. 비교 선택은 메모리 상태나 URL 전달 같은 대안을 검토하며, 새로고침/재방문 후 유지된다고 약속하지 않는다.

## 구현 및 데이터 원칙

- 기존 요구사항을 임의로 삭제하거나 범위를 확장하지 않는다.
- Prisma는 백엔드 ORM으로만 사용하고 한 PostgreSQL 데이터베이스의 테이블 관계를 우선한다. `list DB`와 `funding DB`를 별도 서버 두 개로 가정하지 않는다.
- 로컬 개발자는 각자 PostgreSQL 인스턴스를 사용한다. 이는 공통 schema를 각자 적용하는 구조이며, 각자 별도로 스키마를 설계하거나 로컬 DB 데이터를 Git에 공유하는 방식이 아니다. 통합/운영용 공용 DB는 별도 결정한다.
- API 필드 이름은 `docs/API_SPEC.md`와 `docs/DATABASE_SCHEMA.md`를 기준으로 일관되게 유지한다. 계약 변경 시 FE/BE 문서를 함께 갱신한다.
- 금액은 부동소수점으로 저장하지 않는다. 영화는 **제작비 최소 25,000 USD**(선정용 고정 환율 1 USD = 1,400 KRW에서 3,500만 원 상당)인 작품 100편만 선정한다. 제작비 0·미상·기준 미달 영화는 선정/시드에서 제외한다. `productionBudget`에는 검증된 TMDB USD 제작비 숫자를 그대로 저장하고, `Funding.amount`와 `totalFundedAmount`는 KRW다. 팀의 화면 정책은 `productionBudget` 숫자 자체를 환율 변환 없이 같은 숫자의 원화 목표액으로 표시하고 `totalFundedAmount / productionBudget * 100`으로 달성률을 계산하는 것이다. 값이 NULL/0이면 달성률은 계산할 수 없다. 별도 `fundingGoal` 컬럼은 사용하지 않는다.
- 페이지네이션은 안정적인 정렬을 고려한다. 랜덤 목록을 요청마다 다시 섞어 중복/누락을 만들지 않는다.
- 담당자가 `pnpm movies:select`로 TMDB에서 개봉·관람등급·제작비 조건을 확인해 선정한 100편의 **ID와 상세 메타데이터가 한 파일** `data/movieDetails.json`에 담긴다. `pnpm db:seed`는 이 고정 JSON만 읽어 Prisma로 upsert하며 TMDB 키가 필요 없다. 기존 누적 후원액과 후원 기록은 유지하고, 고정 목록 외 영화가 DB에 있으면 자동 삭제하지 않고 중단한다. 이미 JSON이 있으면 재선정 스크립트가 덮어쓰기를 차단한다. 갱신은 팀 합의 후 담당자가 별도로 진행한다.
- 외부 API, 라이브러리, 배포 플랫폼의 기능/정책은 확인하기 전 단정하지 않는다. TMDB 키는 **영화 재선정** 환경에서만 서버 비밀정보로 관리하며 프런트엔드에 노출하지 않는다.
- 입력 검증, DB 무결성, 안전한 오류 응답을 생략하지 않는다. 내부 예외/SQL/비밀정보를 클라이언트에 노출하지 않는다.

## 현재 구현 상태 (2026-10-19)

- DB 모델: `Movie`, `Funding`, 마이그레이션 2개 및 `prisma/seed.js` 작성됨. 로컬 PostgreSQL 적용 여부는 별도 실행 검증 필요.
- `data/movieDetails.json`: 중복 없는 100편 데이터가 있으며, 영화 선정/검증/시드 코드가 준비됨. 실제 DB 적재 완료 여부는 환경별 확인 필요.
- Express: `src/app.js`, `src/server.js` 및 `GET /health`만 구현됨. 서비스 목록/상세/비교/펀딩/코멘트 API, 서버 요청 검증 및 오류 계약은 아직 미구현.
- 테스트: `pnpm test`(DB 없는 단위 테스트), `pnpm test:db`(실제 DB 연결·100편 검증). 후자는 DB 실행과 시드가 필요하다.
- API 미구현 항목은 `docs/API_SPEC.md`에서 계약 제안과 구현 상태를 구분한다. 팀이 결정한 목표액 표시 규칙, 비밀번호 규칙(영문자와 숫자 각 1개 이상, 8~12자), 커서 페이지 UI 연결 규칙은 관련 문서에 동일하게 반영한다.

## 변경 및 검토 원칙

- 요청된 범위에 맞는 작은 변경을 하고, 기존 문서의 용어·경로·필드 이름과 맞춘다.
- 실제 구현 전에는 관련 명세와 Task를 먼저 정리한다. 코드 변경에는 관련 검증을 추가/실행하고 결과를 사실대로 보고한다.
- 사용자가 요청하지 않은 저장소 생성, 커밋, 푸시, PR, 배포, 외부 서비스 변경을 수행하지 않는다.
- 비밀키, 개인정보, `.env`를 저장소에 추가하지 않는다.
- 문서 작업에서는 파일 수, 링크, 문서 간 주요 계약의 일관성을 확인하고 검증 범위를 명시한다.

## 문서 구조

문서 인덱스와 프로젝트 소개는 `README.md`에 둔다. 기능별 명세는 `docs/` 아래 기존 문서에 반영한다. 새 문서를 만들 때는 같은 내용을 중복 작성하기보다 기준 문서를 정하고 다른 문서에서 링크한다.
