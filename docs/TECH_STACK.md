# 기술 스택 및 협업 도구

> **확인 범위(2026-10-19):** 이 프로젝트의 백엔드 파일(`package.json`, `pnpm-lock.yaml`, `compose.yaml`, Prisma/Express 코드)을 직접 확인했다. 프런트엔드 기술 및 경로는 **이전에 확인한 GitHub `main`의 scaffold 기준**이며, 이 ZIP이 팀 `main`에 병합됐는지는 확인하지 않았다.

## 백엔드 — 이 ZIP에 준비된 기술

| 영역 | 실제 파일 기준 구성 | 구현 수준 |
|---|---|---|
| Runtime / 언어 | Node.js (`package.json` 요구 `^22.12.0 || >=24.0.0`), JavaScript ESM (`"type": "module"`) | 설정 있음 |
| Backend | Express **5.3.0** (`package.json`은 `^5.3.0`, lockfile 해상 버전 5.3.0) | `src/app.js`, `src/server.js`, `GET /health` 구현; **서비스 API 미구현** |
| ORM | Prisma CLI/Client **7.10.0**, `@prisma/adapter-pg` **7.10.0** | 모델, migration 2개, 시드 코드 있음 |
| DB | PostgreSQL **18**, `pg` 드라이버 | Docker Compose 설정 있음; DB 구동은 팀원별 실행·검증 |
| 로컬 DB 포트 | 호스트 `127.0.0.1:5435` → 컨테이너 `5432` | `compose.yaml` 설정 있음 |
| 패키지 관리자 | **pnpm 11.26.0** (`packageManager` 필드, lockfile) | 백엔드에 고정 |
| 환경변수 | `dotenv`, `.env.example` | 개인 `.env` 사용; 비밀키 커밋 금지 |
| 단위 테스트 | Node 내장 `node:test` | `pnpm test`, 영화 선정·검증 함수 테스트 |
| DB 검증 | `src/utils/checkDb.js` | `pnpm test:db`, 실제 DB 실행/시드 후 검증 |
| 영화 수집 | TMDB API + `src/movies/selectMovies.js` | 영화 100편을 `data/movieDetails.json`에 고정; 일반 시드는 TMDB 키 불필요 |

**설치 버전 주의:** pnpm lockfile에서 확인된 Express 버전은 5.3.0이다. `^5.3.0`은 이후 설치 시 lockfile 변경에 따라 달라질 수 있으므로 팀은 `pnpm install --frozen-lockfile`을 사용한다. Prisma는 7.10.0으로 지정됐다.

## 프런트엔드 — 이전 `main` 조사 기준

| 영역 | 확인된 구성(이 ZIP에는 FE 없음) |
|---|---|
| FE | React + JSX / HTML / CSS / JavaScript |
| 개발/빌드 | Vite, React Router |
| CSS | Tailwind CSS v4 형태의 Vite plugin 설정; 패키지 의존성 점검 필요 |
| React Compiler | Babel preset 연결 |
| 린트 | ESLint flat config; FE `pnpm lint` |
| 포맷팅/TS | Prettier/TypeScript 활성화 여부는 이전 조사에서 확인되지 않음 |

이전 FE 조사에서는 `tailwind` 의존성과 `@tailwindcss/vite` 설정 조합의 호환성 점검이 필요했다. FE 저장소에서 `pnpm install`, `pnpm build`, `pnpm lint`로 검증할 일이며, 이 백엔드 문서 변경으로 FE 설정을 수정하지 않는다. [Tailwind Vite 가이드](https://tailwindcss.com/docs/installation/using-vite)

## 데이터 처리와 경계

- `pnpm movies:select`: 담당자가 TMDB에서 영화 100편을 선정해 **`data/movieDetails.json`** 생성. 기존 JSON은 덮어쓰기 차단.
- `pnpm db:seed`: 공유 JSON으로 PostgreSQL을 upsert. 기존 후원 총액·기록 유지, 고정 목록 외 영화가 DB에 있으면 중단.
- 영화 제작비: 최소 25,000 USD(선정용 고정 환율 1 USD = 1,400 KRW로 3,500만 원 상당) 이상만 선정. `productionBudget`은 USD 원본을 저장하고, 후원 금액 및 누적액은 KRW로 관리한다. 펀딩 목표액은 따로 저장하지 않으며 달성률은 현 단계에서 계산하지 않는다.
- 앱 운영 시 React → Express 내부 API → Prisma → PostgreSQL 방향을 목표로 한다. **현재 `GET /health`만 구현**, 영화·펀딩/코멘트 서비스 API는 개발 대기.

## 개발/검증 명령 (백엔드)

```bash
pnpm install --frozen-lockfile
pnpm db:up          # Docker PostgreSQL 18
pnpm db:migrate     # 기존 migration 적용
pnpm db:generate    # Prisma Client 생성
pnpm db:seed        # 기존 JSON 100편 저장
pnpm test           # DB 없는 단위 테스트
pnpm test:db        # 실제 DB 연결·영화 100편 검증
pnpm dev            # Express 서버 (기본 3000), GET /health
pnpm exec prisma studio  # DB 데이터 살펴보기
pnpm db:down        # DB 종료, 볼륨 유지
```

## 협업·코드 품질·배포

- CineFund 백엔드는 Express, Prisma, PostgreSQL을 사용한다. 프런트엔드는 백엔드의 HTTP API를 통해 데이터를 조회하도록 구현할 예정이다. 실제 서비스 API 연동과 배포 구성은 아직 검증되지 않았다.
- DB는 팀원별 로컬 Docker 환경에 재현하고 schema, migration, seed JSON을 Git으로 공유한다. 운영/공용 DB, FE/BE 배포 플랫폼, CORS 허용 origin과 도메인은 TBD다.
- FE는 기존 ESLint 설정을 따르고, BE에는 현재 `pnpm lint` 스크립트가 없으므로 있는 것처럼 표기하지 않는다. Prettier/Airbnb를 임의 도입하지 않는다.
- GitHub Issue/PR을 이용해 검토하고 `.env`, 토큰, 비밀번호를 저장소에 올리지 않는다. 세부 규칙은 [코딩 컨벤션](conventions/CODING_CONVENTION.md) 참고.
