# 인계

## 현재 상태

- 상태: `done`
- 현재 역할: Sol
- 다음 역할: 없음 — 완료 기록
- 작업 버전: `1.12.1`
- 브랜치: `v.1.12.1`
- `main` 아님을 확인: 완료

## 완료 선언

- 2026-08-29 사용자가 현재 결과를 v1.12.1로 커밋하고 main에 반영하도록 승인했습니다.
- 실제 사용 중 발견되는 문제는 새 `v.1.12.2` 브랜치에서 후속 처리합니다.
- 2번 스탭업 주요 구간별 효과는 `NEXTROAD_02_STEPUP_CHECKPOINTS.md`에서 다시 논의하며 자동 구현하지 않습니다.

## 완료한 작업

- 사용자가 첫 sticky 카드 시안을 최종안으로 승인하지 않아 반복 시안 작업으로 재개
- 루트 `NEXTROAD_01_GACHA_QUICK_CONTROLS.md`를 복원하고 세 가지 구조안 및 1안 실험 범위를 기록
- 작업 디렉터리를 `tasks/finish/`에서 활성 위치로 복귀

- 현재 문서 변경을 `v.1.12.X`의 `fa81fbd` 커밋으로 보존
- `v.1.12.1` 구현 브랜치 생성
- 01번 상세 논의 원문을 `SOURCE.md`로 해시 검증 후 이전
- 구현 범위와 UI 결정을 `TASK.md`, `DECISIONS.md`에 확정
- `NEXTROAD.md`와 `tasks/BOARD.md`에 활성 작업 상태 반영

## 변경 파일

- `AGENTS.md`
- `NEXTROAD.md`
- `tasks/BOARD.md`
- `tasks/gacha-quick-controls/SOURCE.md`
- `tasks/gacha-quick-controls/TASK.md`
- `tasks/gacha-quick-controls/DECISIONS.md`
- `tasks/gacha-quick-controls/HANDOFF.md`
- `tasks/gacha-quick-controls/RESULT.md`
- `scsfp/index.html`
- `scsfp/css/gacha.css`
- `scsfp/js/view/gacha/GachaViewConfig.js`
- `scsfp/js/core/Constants.js`

## 실행한 검증

- SOURCE 원문 SHA-256 동일성 확인
- 현재 브랜치 `v.1.12.1` 확인
- 계획 기준 커밋에서 애플리케이션 소스 변경이 없었음을 확인

## 남은 작업

1. 개발자가 실제 화면을 확인하고 커밋·병합 여부를 결정합니다.
2. 수정 의견이 있으면 같은 `v.1.12.1` 브랜치에서 보완합니다.

## 최신 사용자 조정

- 배너 요약을 짧은 형식으로 바꾸고 3성 프리셋을 가챠 설정 dialog 안으로 이동했습니다.
- 기존 3성 `↻`를 모든 LocalStorage를 지우는 앱 전체 초기화로 교체했습니다. 데스크톱은 사이드바 하단, 모바일은 상단 메뉴 오른쪽입니다.
- PC의 `확률표` 버튼은 숨김을 유지하며 모바일에서만 차트와 확률표를 교체합니다.
- 실제 Chrome에서 PJ 요약 문구, 반응형 초기화 위치, 프리셋 순서와 10px 여백, 모바일 전환, LocalStorage 전체 삭제를 검증했습니다.
- 현재 역할과 다음 역할은 계속 Sol이며 사용자 비교용 `planning` 상태를 유지합니다.

## 생일·콜라보·2성 확장

- 사용자가 3성 1안 구조를 생일·콜라보·2성에도 적용하도록 승인해 네 가챠 공통 시안으로 확장했습니다.
- 배너 요약, 공통 settings dialog/container, 탭별 빠른 입력, 고정 결과 스테이지와 모바일 차트/확률표 전환을 반영했습니다.
- 2성은 A–D 그룹 입력을 보존하고 전 탭 높이를 데스크톱 133px·모바일 162px로 고정했습니다.
- 실제 Chart.js Chromium 검증에서 네 가챠 차트, dialog 닫기, 탭별 제어, 반응형 높이와 가로 넘침 없음을 확인했습니다.
- 계산 Core와 게임 규칙은 수정하지 않았습니다. 현재와 다음 역할은 Sol이며, 사용자 최종 확인 전까지 `planning`입니다.

## Terra 구현 결과

- 3성의 `star3-targetMode-btn`, `star3-targetCount`, `star3-normalPulls`, `star3-stepPulls`, `star3-targetProbability` 원본 DOM을 빠른 설정 바로 이동했습니다. 중복 ID나 별도 동기화 코드는 없습니다.
- 빠른 설정 바는 `sub-tab-system-3star` 바로 앞의 `tab-3star` 내부에 두고, CSS `position: sticky; top: 12px`로 제한했습니다.
- `GachaViewConfig`에 `controlVisibility`를 추가해 서브탭별 wrapper만 표시하며, 기존 `buttonVisibility`는 버튼 용도로 유지했습니다.
- 모바일(390px)에서는 두 열·두 줄, 데스크톱에서는 네 열 한 줄로 배치합니다. 모바일 높이는 탭마다 106px로 고정했습니다.
- 앱 버전 및 `common.css`·`gacha.css`·`payment.css`·`main.js` 정적 자산 캐시 키를 `1.12.1`로 올렸습니다.

## 실행한 검증

- `git diff --check` 통과
- 수정 JavaScript의 `node --check` 통과
- 5개 이동 입력 ID가 HTML에 각각 한 번만 존재함을 확인
- 외부 CDN이 이 환경에서 차단되어 실제 Chart.js는 불러오지 못했습니다. 대신 headless Chromium CDP에서 최소 Chart stub을 주입해 실제 `main.js`·ViewModel·InputBinder 초기화 경로를 실행했습니다.
  - 기본 Observable 값과 collection 탭의 빠른 설정 4개 표시 확인
  - collection/total/efficiency/rainbow의 표시 제어가 TASK 결정과 일치함을 확인
  - 390px 폭에서 문서 폭 390px, 빠른 설정 폭 350px, 네 제어가 두 열 안에 들어감을 확인
  - 네 서브탭 모두 빠른 설정 바 높이 106px 확인
  - `normalPulls=40`, target mode 전환, `targetCount=9 → 2`, `stepPulls=999 → 80`, `targetProbability=95`의 InputBinder·요약 재계산·LocalStorage 저장을 확인
  - 모바일 스크롤에서 sticky 상단 위치 12px 확인

## 미해결 질문

- 확률 Core와 게임 규칙은 수정하지 않았으며, 이 UI 작업에서 새 도메인 의문은 발견하지 못했습니다.
- Terra 샌드박스의 CDN 차단은 Sol이 샌드박스 밖의 격리된 headless Chrome에서 실제 Chart.js 차트 렌더링을 확인해 해소했습니다.

## Sol 검토 결과

- 구현 범위와 `DECISIONS.md`의 탭별 표시 계약이 일치합니다.
- 이동 대상 ID 5개가 각각 한 번만 존재하고 기존 Observable·InputBinder 계약을 유지합니다.
- 계획 커밋 `fa81fbd` 이후 계산 계층은 `APP_VERSION` 외에 변경되지 않았습니다.
- 독립 CDP 검증에서 390×844 viewport의 문서 폭 390px, 빠른 설정 폭 350px, 전 서브탭 높이 106px과 탭별 표시 목록을 확인했습니다.
- 샌드박스 밖 headless Chrome에서 실제 Chart.js 차트 렌더링까지 확인했으며 수정 요청 없이 최종 승인합니다.

## 2차 시안 — 1안 Terra 인계

### 완료한 작업

- 3성 `가챠 정보`의 원본 입력 ID를 유지한 채 한 줄 배너 요약과 native `dialog` 가챠 설정으로 재배치했습니다.
- 기존 sticky 106px 빠른 설정 카드는 압축 영역으로 바꾸고 옵션 행은 결과 콘텐츠 바로 위의 별도 무배경 구조로 유지했습니다.
- 모바일 픽업 획득에 계산 토글과 분리된 `차트 / 확률표` 전환을 추가했습니다.
- 3성 결과 네 탭을 높이 430px(모바일) / 420px(데스크톱)의 내부 스크롤 결과 스테이지로 옮겼습니다.

### 변경 파일

- `scsfp/index.html`
- `scsfp/css/gacha.css`
- `scsfp/js/viewmodel/gacha/Star3GachaViewModel.js`
- `scsfp/js/view/gacha/GachaViewConfig.js`
- `tasks/gacha-quick-controls/{TASK.md,HANDOFF.md,RESULT.md}`
- `tasks/BOARD.md`

### 검증

- `node --check`으로 수정 JavaScript 두 파일 통과, `git diff --check` 통과.
- 8개 원본 입력 ID가 각각 한 번만 존재함을 확인.
- Chart stub을 주입한 390×844 CDP에서 배너 요약 동기화, dialog 열기/닫기, 탭별 제어 노출, 차트/확률표 전환, 고정 430px 결과 스테이지와 가로 넘침 없음을 확인.
- 1280×900 CDP에서 가로 넘침 없음, 420px 결과 스테이지, 차트·범례 나란히 표시 및 모바일 전환 버튼 비표시를 확인.

### 남은 작업과 미해결 사항

- Sol은 실제 Chart.js CDN 렌더링 및 사용자 관점의 2차 시안 사용성을 검토합니다. CDN이 이 환경에서 차단되므로 현재 검증은 Chart stub 기반입니다.
- 확률 Core·게임 규칙은 변경하지 않았고, 새 도메인 의문은 없습니다.
- 이 작업은 사용자 비교용 반복 시안입니다. 승인 전까지 `done` 또는 `tasks/finish/`로 옮기지 않습니다.

### 역할과 브랜치

- 현재 역할: Sol
- 다음 역할: Sol
- 브랜치: `v.1.12.1`

## 2차 시안 — Sol 1차 검토 수정 요청

- 샌드박스 밖 Chrome에서 실제 CDN Chart.js 로드와 차트 생성을 확인했습니다.
- 390×844에서 결과 스테이지는 전 탭 430px로 고정됐지만 문서 전체 높이는 픽업 획득 1116px, 총 획득 1048px, 일반 vs 스탭업 1048px, 무돌 1521px였습니다.
- 원인은 고정 스테이지 밖의 공용 `gacha-result-area` 내용 높이가 탭마다 달라지는 점입니다. 3성 활성 시 요약/상세 영역을 제한 높이의 내부 스크롤 영역으로 만들거나 같은 효과의 구조로 바꿔 전체 문서 높이를 안정화하세요.
- 모바일 결과 제어 높이도 일반 탭 약 110px, 무돌 약 104px로 달랐습니다. 빈 공간을 과하게 늘리지 않는 범위에서 동일하게 유지하세요.
- 차트/확률표 전환은 숨김 대상 부모의 실제 표시 상태로 다시 검증하세요.
- 수정 후 실제 측정값을 `RESULT.md`에 덮어쓰지 말고 보완 기록으로 추가하고 `ready-for-sol-review`로 반환하세요. `done`/`finish` 이동은 금지합니다.

## 2차 시안 — Sol 보완 검토 결과

- 샌드박스 밖 headless Chrome에서 실제 jsDelivr Chart.js가 로드되고 `resultChart` 인스턴스가 생성됨을 확인했습니다.
- 390×844 실제 CDN 환경에서 네 서브탭 모두 문서 높이 1048px, 결과 제어 110px, 결과 스테이지 430px, 공용 요약 148px로 일치했습니다.
- 공용 요약의 실제 콘텐츠는 탭별로 147~626px이지만 148px 내부 스크롤 영역 안에 머물러 바깥 문서 높이를 바꾸지 않습니다.
- 모바일 `차트 / 확률표` 전환 시 차트 부모는 `flex / 350px → none / 0px`, 범례는 `none / 0px → block / 약 129px`로 실제 교체됩니다.
- 전역 가로폭은 viewport와 같은 390px이며 계산 Core 변경은 없습니다.
- 구현 품질상 추가 수정 요청은 없지만 이 시안은 최종 승인이 아닙니다. 상태를 사용자 비교를 위한 `planning`으로 되돌리고 루트 01 문서와 활성 task를 유지합니다.

## 2차 시안 — 1안 보완 Terra 인계

### 완료한 작업

- 3성 활성 시 공용 `gacha-result-area`를 148px 고정 높이·내부 세로 스크롤로 제한했습니다. 탭별 요약/상세 내용은 보존하며, 문서 바깥 높이만 안정화합니다.
- 모바일 `.star3-result-controls` 높이를 110px로 고정해 일반 탭과 무돌 탭이 같은 높이를 사용하게 했습니다.
- 차트/확률표 전환은 활성 수집 탭의 부모·차트·범례 각각의 computed display와 geometry를 확인했습니다.

### 검증

- Chart stub CDP 390×844에서 collection / total / efficiency / rainbow 모두 문서 높이 1047px, 결과 제어 110px, 결과 스테이지 430px, 공용 요약 148px으로 동일함을 확인했습니다.
- 같은 검증에서 가로폭은 모두 390px이며 넘침이 없었습니다.
- 차트 보기에서는 차트 `flex` 350×350px·범례 `none` 0×0px, 확률표 보기에서는 차트 `none` 0×0px·범례 `block` 350×210px을 확인했습니다.
- `node --check`과 `git diff --check`은 이번 보완 후 다시 실행 대상입니다.

### 남은 작업과 역할

- Sol은 실제 CDN Chrome에서 위 네 탭의 문서 높이와 실차트/범례 전환을 재확인합니다.
- 계산 Core와 게임 규칙은 수정하지 않았으며, 작업은 계속 사용자 비교용 시안입니다. `done`·`finish/` 전환과 커밋은 금지됩니다.
- 현재 역할: Sol / 다음 역할: Sol / 브랜치: `v.1.12.1`
