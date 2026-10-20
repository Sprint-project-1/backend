# Git 협업 및 커밋 컨벤션

> 프런트엔드는 [Sprint-project-1/cine-fund](https://github.com/Sprint-project-1/cine-fund), 백엔드는 [Sprint-project-1/backend](https://github.com/Sprint-project-1/backend)에서 별도로 관리한다. 코드잇 가이드의 `16기-{Cinefund}-{3팀}-{BE or FE}`는 저장소 이름 제안이며 실제 저장소명은 각 GitHub 저장소를 기준으로 한다.

커밋 가이드는 [느낌 있는 Commit Message 작성하기](https://nohack.tistory.com/17)의 type/scope/subject, 본문, Issue footer 구성과 작은 목적 단위 커밋 원칙을 참고해 팀용으로 단순화했다. 참고 글의 제목 길이 등 세부 문구는 팀 합의 전 강제 규칙으로 두지 않는다.

## 브랜치

- 기본 브랜치 `main`이 현재 저장소에 존재한다. 브랜치 보호/필수 리뷰 규칙은 저장소 설정에서 확인 후 적용한다.
- 기능: `feature/task-12` (또는 `feature/issue-12-short-name` 제안)
- 버그: `fix/task-12` 또는 `fix/issue-12-short-name`
- 문서/정비는 `docs/...`, `chore/...` 제안. 브랜치명에 팀 합의 식별자 필요 여부 TBD.
- main 직접 push 금지 제안. 작업은 최신 main 기준으로 작은 PR로 제출한다.

## 커밋 메시지

기본 형식은 `<type>(<scope>): <subject>` 제안. 제목은 간결한 명령/변경 내용으로 쓰고 마침표를 생략한다. 본문에는 무엇/왜를 적고, footer에 `Fixes #12` 등 연결한다. 한 커밋은 한 목적을 담는다.

| 타입 | 용도 |
|---|---|
| feat | 기능 추가 |
| fix | 버그 수정 |
| docs | 문서 |
| style | 동작 변경 없는 포맷/CSS 스타일(팀에서 구분 기준 합의) |
| refactor | 동작 유지 코드 개선 |
| test | 테스트 |
| build | 빌드/의존성 |
| ci | 자동화 설정 |
| perf | 성능 |
| chore | 기타 정비 |

예: `feat(movie-list): add cursor pagination` · `docs(api): clarify funding response`

## Issue, PR, 리뷰, 병합

- 작업 전 Issue에 목적, 범위, 완료 조건, 담당자를 적고 PR에서 연결한다.
- PR에는 변경 요약, 관련 Issue, 검증 결과, 화면 캡처(해당 시), 위험/후속 작업을 기록한다. 미완성은 Draft PR로 공유한다.
- Merge 전 최소 1명 Approve를 요구한다. 단, 페어 프로그래밍으로 실시간 함께 작성한 변경은 팀 합의에 따라 리뷰 생략 가능하며 PR에 페어를 기록한다.
- 리뷰어는 합의된 응답 시간 내 검토한다(시간 TBD). 기능/오류/보안/가독성을 확인하고 질문은 존중하는 표현으로 작성한다.
- 승인 전 본인 변경을 반영하고 CI/수동 검증 결과를 기록한다. Merge 방식(squash 등)은 TBD이며 저장소 설정 후 통일한다.
- 충돌은 변경 의도를 확인해 작업 브랜치에서 해결하고 관련 테스트/검증 후 다시 리뷰 요청한다. 타인의 커밋을 무단 덮어쓰지 않는다.
- 긴급 수정은 팀 채널에 영향과 이유를 공유하고 `fix/` PR로 신속 리뷰 후 main 반영한다. 사후 기록/검토를 생략하지 않는다.

## 금지 작업

비밀키/개인정보 커밋, main 직접 push/강제 push, 리뷰되지 않은 대규모 변경 병합, 관계없는 파일을 포함한 혼합 커밋, 타인 브랜치 임의 삭제/수정 금지. 보호 브랜치/필수 검사 설정은 현재 저장소에서 확인하고 담당자를 지정한다.
