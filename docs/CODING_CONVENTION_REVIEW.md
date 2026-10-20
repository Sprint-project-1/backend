# 영화 탐색 페이지 코드 컨벤션 점검

> 점검일: 2026-10-15  
> 기준 문서: [코딩 컨벤션](conventions/CODING_CONVENTION.md)  
> 점검 범위: 현재 작업 트리의 `client/pages/HomePage.jsx`, `client/index.css`, `client/components/Navbar.jsx` 변경분. 이 문서는 검토 기록이며 코드 수정이나 팀 규칙 확정을 뜻하지 않는다.

## 결과 요약

기본 네이밍, React 컴포넌트 표기, 상수 표기, JSX 구조는 컨벤션 방향과 대체로 일치한다. 저장소 ESLint 검사도 통과했다. 다만 팀 문서가 제안으로 둔 이벤트 핸들러 이름과 일부 함수 이름이 다르다. Top 3 이동 버튼 제거 후 남아 있던 CSS는 PR 준비 과정에서 정리했다. 핸들러 이름은 문서상 제안이므로 필수 수정은 아니다.

## 항목별 점검

| 항목 | 결과 | 근거 및 의견 |
|---|---|---|
| 변수·함수 camelCase | 대체로 일치 | `searchTerm`, `filteredMovies`, `formatAmount`, `getAchievement` 등 camelCase를 사용한다. 이벤트 처리 목적의 `openMovie`, `changePage`는 컨벤션 제안인 `handle` 접두사와 다르다. `handleOpenMovie`, `handlePageChange`처럼 맞추는 것은 선택적 정리다. |
| 컴포넌트 PascalCase | 일치 | `HomePage`, `Poster`, `FundingProgress`, `MovieCard`, `RankedMovieCard`, `ScrollRail`을 PascalCase로 작성했다. |
| 상수 UPPER_SNAKE_CASE | 일치 | 페이지 크기는 `MOVIES_PER_PAGE`로 이름 지었다. |
| React 상태·Props | 양호 | 필요한 데이터를 `movie`, `onOpen`으로 전달한다. 자식의 콜백 prop에 `on` 접두사를 사용했다. |
| JSX·접근성 기본 | 양호 | 버튼에 `type="button"`을 지정하고 페이지 이동 버튼에 스크린 리더용 `aria-label`, 현재 페이지에 `aria-current`를 제공한다. 진행률에는 `progressbar` 역할과 수치를 둔다. |
| CSS 클래스 이름 | 방향 일치 | `.movie-card`, `.movie-card__title`, `.pagination__page`처럼 기존 문서 예시와 같은 kebab/BEM 계열을 사용한다. |
| 매직 넘버·반복 | 대체로 양호 | 페이지 크기 10은 상수로 분리했다. 영화 예시 데이터의 금액·색상 값은 목업 데이터에 포함된 표현값이다. |
| 작은 책임·파일 구성 | 검토 가능 | 카드/포스터/진행률 표시를 작은 컴포넌트로 나눴다. 컨벤션의 “한 파일 한 주요 컴포넌트”는 제안이므로 현재 보조 컴포넌트가 같은 파일에 있는 것을 위반으로 단정하지 않는다. 규모가 커지면 분리할 수 있다. |
| 미사용 코드 | 정리됨 | Top 3 좌우 버튼 제거 후 남아 있던 `.rail-arrow` 및 반응형 CSS 규칙을 PR 준비 중 삭제했다. |
| 서식 도구 | 부분 확인 | `pnpm lint`가 통과했다. 저장소에 Prettier 설정/스크립트가 확인되지 않아 Prettier 적용 여부는 판정하지 않았다. |

## 확인 결과

- `pnpm.cmd lint`: 통과
- `pnpm.cmd build`: 이번 컨벤션 점검에서는 다시 실행하지 않음
- 테스트: 이번 점검 범위에 포함하지 않음

ESLint 설정은 저장소의 flat config, ESLint 권장 규칙, React Hooks 및 React Refresh 설정을 사용한다. Airbnb 또는 Prettier가 활성화되어 있다고 가정하지 않았다.

## 권장 후속 정리

1. `openMovie`와 `changePage`를 이벤트 핸들러로 명확히 드러내고 싶다면 `handleOpenMovie`, `handlePageChange`로 이름을 맞출 수 있다. 이는 컨벤션 문서상 제안이며 필수 수정은 아니다.
2. Prettier를 팀에서 쓰기로 결정할 때만 현재 ESLint flat config와 호환되는 설정을 추가하고 포맷 기준을 합의한다.
