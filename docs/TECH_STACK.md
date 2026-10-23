# 기술 스택 및 협업 도구

> 이 저장소의 백엔드 설정은 `package.json`, `pnpm-lock.yaml`, `compose.yaml`, Prisma schema 및 migration을 기준으로 기록했다. 프런트엔드 정보는 별도 저장소에서 확인한 기술 구성이다.

## 현재 저장소에서 확인된 기술

| 영역 | 확인 상태 | 구성 |
|---|---|---|
| Front-end | 저장소 적용됨 | React + JSX, HTML, CSS, JavaScript |
| 개발 서버/빌드 | 저장소 적용됨 | Vite; `pnpm dev`, `pnpm build`, `pnpm preview` |
| 라우팅 | 의존성 및 코드 적용됨 | React Router; 실제 앱 경로는 `client/App.jsx` 참조 |
| CSS 도구 | 설정 적용됨, 의존성 확인 필요 | `@tailwindcss/vite` v4 plugin, CSS에서 `@import "tailwindcss"` 사용 |
| React Compiler | 설정 적용됨 | `vite.config.js`에서 `reactCompilerPreset()` 연결 |
| 패키지 매니저 | 저장소 적용됨 | pnpm, `pnpm-lock.yaml` 존재 |
| 린트 | 저장소 적용됨 | ESLint flat config, `pnpm lint`; ESLint React Hooks/Refresh 규칙 포함 |
| 형식화 | TBD | Prettier는 현재 `package.json`에서 확인되지 않음 |
| Back-end | 저장소 설정됨 | Node.js (`^22.12.0 || >=24.0.0`), Express 5.3.0; 현재 `GET /health`만 구현 |
| ORM / DB | 저장소 설정됨 | Prisma 7.10.0 / PostgreSQL 18; schema와 migration 존재 |
| 패키지 매니저 | 저장소 설정됨 | pnpm 11.26.0 지정, `pnpm-lock.yaml` 존재 |
| TMDB | seed 준비됨 | 영화 선정 스크립트에서 고정 영화 100편을 선택하고 JSON을 생성; DB seed는 JSON만 사용. 페이지 요청 중 호출하지 않음 |

백엔드의 서비스 API는 아직 구현되지 않았다. 프런트엔드 기술 세부와 라우트는 별도 `cine-fund` 저장소를 기준으로 하며, 이 문서에서는 백엔드 실행 설정과 혼동하지 않는다.

### 저장소 설정 확인이 필요한 항목

현재 `package.json`은 Tailwind 의존성 이름으로 `tailwind`를 선언하고, Vite plugin/CSS import는 Tailwind CSS v4 구성 형태다. Tailwind 공식 Vite 설치 안내는 `tailwindcss`와 `@tailwindcss/vite`를 함께 설치하도록 설명하므로, 저장소 담당자가 lockfile과 `pnpm install`, `pnpm build` 결과를 확인해 의존성 이름이 의도한 것인지 점검해야 한다. 이 문서는 원격 `main`을 임의 수정하지 않았다. [Tailwind 공식 Vite 설치 안내](https://tailwindcss.com/docs/installation/using-vite)

## 개발 환경 및 협업

- 저장소: [Sprint-project-1/cine-fund](https://github.com/Sprint-project-1/cine-fund), 기본 브랜치 `main` 확인.
- 실행/검증 스크립트는 `README.md`와 `package.json` 참조: `pnpm dev`, `pnpm test`, `pnpm test:db`, `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`.
- 프런트엔드는 별도 [cine-fund 저장소](https://github.com/Sprint-project-1/cine-fund)에서 관리한다.
- PostgreSQL은 팀원별 Docker 로컬 인스턴스를 사용한다. 공통 Prisma schema/migration/seed가 구조를 맞추고 실제 데이터는 각자 로컬에 둔다.
- GitHub Issue/PR로 작업·리뷰를 관리한다. 프로젝트 보드와 소통 채널(Discord 등)은 팀 합의가 필요하다.
- 외부 DB 호스팅, FE/BE 배포 플랫폼과 도메인은 후보 조사 후 결정한다.

## 코드 품질 정책

현재 저장소의 ESLint flat config를 기준으로 사용한다. Prettier와 Airbnb 규칙은 현재 설치/적용 사실이 확인되지 않으므로 활성화된 것처럼 문서화하지 않는다. 필요하면 저장소의 현재 ESLint major, flat config, React plugin과의 호환성을 확인해 별도 PR로 합의한다. 기존 CRA 중심 ESLint 설정을 그대로 복사하지 않는다. 상세 규칙은 [코딩 컨벤션](conventions/CODING_CONVENTION.md)을 따른다.

## 기술 선택의 이유와 리스크

| 기술/방식 | 이점 | 주의할 점 |
|---|---|---|
| React + JSX | 기획에서 정한 UI 개발 방식이며 컴포넌트 단위로 화면 구성 가능 | 앱 상태와 서버 데이터 상태를 구분하고 컴포넌트 책임을 관리 |
| Vite | 저장소에 설정된 개발 서버/빌드 도구 | 배포 경로/base 설정은 배포 환경에 맞춰 확인 |
| React Router | 페이지 scaffold의 라우팅에 사용 | 현재 구현 경로와 기존 기획 경로가 일부 다름 |
| Tailwind CSS v4 | 현재 Vite plugin 및 의존성 설정에 포함 | 디자인 토큰/클래스 사용 규칙을 팀이 정리할 필요 |
| React Compiler | 현재 Vite/Babel 설정에서 활성화 | 개발/빌드 성능에 영향 가능; 설정을 바꿀 때 빌드 확인 |
| ESLint | 현재 코드 검사 스크립트와 flat config가 존재 | 팀 규칙 추가 전 기존 구성 및 ESLint 10 호환 확인 |
| Node.js + Prisma + PostgreSQL | 서버 계층과 관계형 데이터/마이그레이션을 계획 | 현재 저장소에는 구현 없음; 버전·환경·동시성 설계 필요 |
| TMDB seed/import | 지정된 영화 메타데이터를 로컬 DB에 적재해 런타임 의존 감소 | 고정 ID 100개, API 키, 호출 실패/재실행·데이터 라이선스 정책 관리 |

## 실행 및 배포

현재 프런트엔드 개발/빌드/lint 명령은 저장소 README의 `pnpm` 명령을 사용한다. 백엔드, DB, seed/import 실행 및 배포 절차는 해당 설정과 구현이 저장소에 추가된 뒤 갱신한다. 각 환경의 비밀값은 환경변수로 관리하고 저장소에 올리지 않는다.
