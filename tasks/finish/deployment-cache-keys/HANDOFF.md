# 인계

## 현재 상태

- 상태: `done` — 사용자 승인 및 공개 배포 진행
- 현재 역할: Sol
- 다음 역할: 없음 — 완료 기록
- 브랜치: `v.1.12.X`
- 공개 배포: 2026-08-29 사용자 승인

## 완료한 작업

- 공개 캐시 장애 원인과 수동 쿼리 방식의 반복 비용 확인
- 고정 파일명과 ES 모듈 구조를 유지하는 배포 사본 SHA 삽입 방식 결정
- 구현 범위와 검증 조건 기록
- 외부 패키지 없는 Node 변환·검증 스크립트 구현
- 원본의 수동 `?v=1.12.2` 제거 및 원본 청결 검사 추가
- Jekyll 산출물 생성 후 커밋 SHA 삽입·재검사 workflow 단계 추가
- 단위 테스트, 전체 JavaScript 구문 검사, 배포 사본 검사와 실제 Chrome 실행 검증 완료

## 남은 작업

1. `v.1.12.X` 커밋·푸시와 `main` 병합·Pages 배포를 수행합니다.
2. 실제 Actions 산출물과 공개 Pages 요청 URL을 확인합니다.

## 완료 승인

- 2026-08-29 사용자가 현재 구현을 실제 `main`까지 커밋·병합하고 GitHub Pages에 배포하도록 승인했습니다.

## 변경 예정 파일

- `.github/workflows/jekyll-gh-pages.yml`
- `scripts/apply-deployment-cache-key.mjs`
- `scsfp/index.html`
- 캐시 쿼리가 남은 관련 JavaScript
- `AGENTS.md`
- `tasks/BOARD.md`
- `tasks/deployment-cache-keys/*`
- `.gitignore`
- `.vscode/settings.json` (Git 추적에서만 제거, 로컬 파일 유지)

## 실행한 검증

- `node --test scripts/apply-deployment-cache-key.test.mjs`: 2개 통과
- `--check-source scsfp`: 로컬 JS/CSS 참조 105개에 수동 `v` 키 없음
- 배포 사본 `--write` 및 `--check`: 105개 참조를 동일한 12자리 SHA로 변환·검사
- 전체 `scsfp/js/**/*.js`에 `node --check` 통과
- `git diff --check` 통과
- 실제 Chart.js를 사용하는 격리 Chrome에서 앱 버전 `1.12.2`, canvas 12개, 로컬 자산 요청 40개 확인
- 브라우저의 로컬 자산 요청 40개 모두 같은 SHA 사용, 불일치 0건, 런타임 예외 0건
- 커밋 전 공개 범위 검사에서 `.vscode/`와 경로 깊이에 관계없는 모든 `primary/` 디렉터리를 ignore 처리하고, 기존 `.vscode/settings.json`을 Git 추적에서 제거함
- 개인 게임 참고 자료 14개(11,707,923바이트)를 `scsfp/docs/game/img/`에서 `scsfp/docs/game/primary/img/`로 손실 없이 이동함
- `AGENTS.md`, `tasks/`, `scripts/`가 ignore되지 않아 의도대로 추적 가능한 상태임을 확인함

## 미검증 경계

- 변경된 GitHub Actions workflow는 아직 `main`에 올라가지 않았으므로 실제 Actions runner 실행과 공개 Pages 배포는 수행하지 않았습니다.
- 현재 저장소의 정적 import는 한 줄 문자열 리터럴 형식입니다. 향후 여러 줄 또는 계산식 기반 import를 도입하면 변환 스크립트 지원 여부를 함께 확인해야 합니다.
