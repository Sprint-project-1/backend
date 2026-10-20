# 코딩 컨벤션

> 이전 확인한 FE GitHub `main`은 JavaScript/JSX, Vite, ESLint flat config를 사용한다. **이번 BE ZIP은 JavaScript ESM, Express 5.3.0, Prisma 7.10.0, pnpm 11.26.0을 사용**하며 FE와 파일 구조가 다르다. 아래 세부 네이밍 규칙은 팀 제안이며 합의 후 필수화한다. Airbnb 설정 글은 2020년 CRA 중심이므로 설정 파일을 그대로 복사하지 않는다.

## 참고자료 및 확인 범위

- [Frontend Fundamentals — Code Quality](https://frontend-fundamentals.com/code-quality/): 변경하기 쉬운 코드 판단과 코드 리뷰 자료의 방향을 참고했다.
- [ESLint & Prettier, Airbnb Style Guide 설정 글](https://velog.io/@_jouz_ryul/ESLint-Prettier-Airbnb-Style-Guide%EB%A1%9C-%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0): ESLint/Prettier 역할과 Airbnb 규칙 사례를 참고했다. 2020년 CRA 전제 설정은 현재 toolchain 호환 확인 없이 적용하지 않는다.
- 코드잇 README 페이지와 Notion 팀 페이지는 열람 시 내부 오류가 발생해 내용을 확인하지 못했다. 해당 자료의 내용을 반영했다고 주장하지 않는다.

## 공통 원칙

- 읽기 쉬운 코드와 작은 책임을 우선한다. 중복을 줄이되 추상화를 위해 추상화하지 않는다.
- 함수는 한 가지 일을 하고 이름으로 의도를 드러낸다. 불변 데이터와 명시적 오류 처리를 선호한다.
- 사용자 입력은 경계에서 검증한다. 서버 규칙을 프런트엔드 UI에만 맡기지 않는다.
- 의미 있는 이유가 없는 주석보다 명확한 이름을 쓴다. 복잡한 정책/결정은 주석과 문서에 근거를 남긴다.

## 이름 및 파일

| 대상 | 규칙 제안 | 예 |
|---|---|---|
| 변수/함수 | camelCase, 동사형 함수 | `movieList`, `fetchMovie` |
| 클래스 | PascalCase | `TmdbClient` |
| React 컴포넌트 | PascalCase | `MovieCard.jsx` / `MovieCard` |
| 상수 | 의미 있는 값은 UPPER_SNAKE_CASE | `MAX_COMPARE_COUNT` |
| 파일 | 컴포넌트 PascalCase, 유틸 camelCase | `FundingModal.jsx`, `formatAmount.js` |
| CSS class | kebab-case, 컴포넌트 접두/모듈 방식 TBD | `.movie-card__title` |
| 이벤트 핸들러 | `handle` + 동작 | `handleSubmit`, prop callback은 `onSubmit` |

JS는 `const` 우선, 재할당 필요 시 `let`, `var` 금지 제안. `===` 사용, 의미 없는 축약/매직 넘버를 피한다. JSX 컴포넌트는 한 파일 한 주요 컴포넌트 제안. Props는 필요한 값만 명시한다. 현재 TypeScript는 사용하지 않으며 runtime prop validation 도구는 미정이다.

## import 및 디렉터리 제안

외부 패키지 → 내부 절대/별칭 → 상대 경로 순으로 그룹화하고 각 그룹 내 정렬 여부는 formatter/linter로 통일한다. 별칭은 빌드 설정 전제 확인.

**현재 BE ZIP의 실제 구조:**

```text
src/
  app.js             # Express 앱 + /health, BigInt JSON 변환
  server.js          # Express 실행
  config/db.js       # Prisma DB 연결
  movies/            # TMDB 선정, JSON 검증
  utils/checkDb.js   # DB 100편 검증
prisma/
  schema.prisma      # Movie, Funding
  migrations/        # migration 2개
  seed.js            # JSON 100편 upsert
data/movieDetails.json
tests/movieData.test.js
```

이전 확인한 FE `main`의 코드는 `client/` 아래에 있었다. 이 BE ZIP은 별도 폴더로 전달되었으며, **팀 `main`에 병합됐는지와 최종 저장소 운영 방식은 이 ZIP만으로 확정할 수 없다.** `routes/`, `services/`, `middleware/` 분리는 **추후 영화·펀딩 API 구현 제안**이며 현재 존재하는 폴더가 아니다.

## ESLint / Prettier

이전에 확인한 **FE 저장소**에는 ESLint flat config와 `pnpm lint` 스크립트가 있다. **현재 BE ZIP에는 `pnpm lint` 스크립트나 ESLint 설정이 없다.** FE `package.json`에서 Prettier는 확인되지 않았으므로 이미 쓰고 있다고 간주하지 않는다. Prettier나 Airbnb 규칙 추가는 선택 사항이며 ESLint 10, flat config, 기존 React Hooks/Refresh 설정과 호환성을 확인한 후 합의한다. 구형 `.eslintrc`/CRA 설정을 무조건 복사하지 않는다. TypeScript는 현재 사용하지 않으며, Vite 템플릿 README의 일반 권장사항만으로 도입을 확정하지 않는다.

## 좋은 코드와 나쁜 코드

```js
// 좋은 예: 의도와 입력 검증이 보임
function isValidCompareCount(movieIds) {
  return movieIds.length >= 2 && movieIds.length <= 5;
}

// 나쁜 예: 의미 없는 이름, 매직 값, 검증 부재
function x(a) {
  return a.length < 6;
}
```

```jsx
function MovieCard({ movie, onSelect }) {
  return <button onClick={() => onSelect(movie.movieId)}>{movie.title}</button>;
}
```
