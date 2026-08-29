# DEVLOG.md

샤니송 유틸리티의 완료된 변경과 설계 맥락을 기록하는 개발 기록입니다.

이 문서는 Codex·Claude 같은 코딩 에이전트가 작성·관리하고 개발자와 공유합니다. 개발자는 주로 열람하거나 정정이 필요할 때 에이전트에게 반영을 요청하며, 자유 형식 메모는 `NEXTROAD.md` 또는 `scsfp/docs/`에 기록합니다.

날짜가 붙은 과거 항목의 경로·명칭·구현 설명은 당시 상태를 나타내므로 현재 코드에 맞춰 소급 수정하지 않습니다. 현재 동작과 규칙은 실제 소스 코드와 `scsfp/docs/game/` 문서를 우선하여 확인합니다.

---

## v1.12.2 (2026-08-29) - GitHub Pages 모듈 캐시 오류 수정

- 새 `main.js`와 이전 `StorageManager.js`가 혼합되어 전체 초기화에서 `clearAll is not a function`이 발생하던 배포 오류 수정
- GitHub Pages에서 변경된 ES module 그래프가 같은 버전 URL로 갱신되도록 import 캐시 키 연결
- 이전 모듈이 일시적으로 혼재해도 전체 초기화가 동작하도록 방어 경로 추가
- 앱 버전과 정적 CSS·JavaScript 자산 키를 `1.12.2`로 갱신

---

## v1.12.1 (2026-08-29) - 가챠 설정·결과 UI 개선

### UI와 조작 흐름

- 3성·생일·콜라보·2성의 큰 설정 영역을 짧은 배너 요약과 `가챠 설정` dialog로 재배치
- 자주 바꾸는 일반·스탭업 횟수, 목표 픽업 수와 목표 확률을 결과 가까이의 빠른 설정으로 이동
- 2성 A–D 그룹 입력은 그룹 경계를 유지한 압축 행으로 구성
- 네 가챠의 결과 영역 높이를 고정하고 모바일에서 차트와 확률표를 전환하도록 개선
- 3성 무돌 서브탭은 기능과 코드를 보존한 채 UI에서 보류

### 공통 동작

- 설정 dialog의 실제 내용을 공통 container로 묶고 ×, Escape와 반투명 배경 클릭 닫기를 지원
- 가챠별 초기화 버튼을 앱 전체 LocalStorage 초기화 버튼으로 통합하고 데스크톱 사이드바 하단·모바일 메뉴 오른쪽에 배치
- dialog와 모바일 차트/확률표 전환 동작을 `BaseGachaViewModel`에서 공통 처리

### 호환성과 검증

- 기존 입력 ID, Observable, InputBinder와 가챠 계산 Core 및 게임 규칙 유지
- 실제 CDN Chart.js Chromium에서 네 가챠 차트, dialog, 탭별 빠른 설정, 데스크톱·모바일 레이아웃 검증
- 완료 작업 기록: `tasks/finish/gacha-quick-controls/`

---

## 문서 운영 체계 정비 (2026-08-29, `v.1.11.X`)

- 다음 개발 논의는 루트 `NEXTROAD.md`, 승인된 구현 작업은 루트 `tasks/`, 현재 게임·프로젝트 지식은 `scsfp/docs/`로 책임을 분리
- 기존 `docs/UPDATE.md`를 에이전트 관리 장기 기록인 루트 `DEVLOG.md`로 이동
- `main`을 GitHub Pages 실서비스 브랜치로 명시하고, 버전 계열 브랜치에서만 작업하며 커밋·병합·배포는 개발자가 직접 수행하도록 운영 규칙 정리
- 버전은 `1.<major>.<minor>`, 계열 브랜치는 `v.1.<major>.X`로 관리하고 맨 앞의 `1` 변경은 개발자 판단으로 제한
- 애플리케이션 코드와 사용자 동작은 변경하지 않음

---

## v1.11.0 (2026-08-29) - 기존 기능 보존 리팩토링 및 문서 정비

### 리팩토링

- 가챠 계산 결과와 전략 데이터의 의미가 드러나도록 변수·필드·JSDoc을 정리하고, 기존 확률 계산 순서와 게임 규칙은 유지
- 사용자 화면의 비교 표현을 `일반`, `스탭업`, `천장`, `셀렉 티켓`, `Best (성공)`, `Worst (폭사)`처럼 간결한 한국어 용어로 통일
- 공통·가챠·과금 CSS의 책임을 재정리하고 중복·미사용 규칙과 구형 토큰을 제거
- 결제 테이블의 통화 표시, 간단히 보기, hover·선택 상태 클래스를 의미 중심으로 정리

### 데이터

- 2026년 5월 기준 iOS 일반·페스 패키지 가격 갱신 내용을 현행 설정과 문서에 반영

### 문서 및 작업 체계

- 프로젝트 명칭을 현재 범위에 맞는 `샤니송 유틸리티`로 통일
- 게임·과금 규칙은 `docs/game/`, 변경 이력은 `docs/UPDATE.md`, 대형 작업 문서는 `docs/tasks/`로 구분
- 완료 작업을 보존하는 `docs/tasks/finish/`와 Sol 설계·검토 / Terra 구현 인계 절차 추가
- 오래된 `CLAUDE.md`, `REFACTORING.md`, `README.md`를 제거하고 현재 코드 기준의 `AGENTS.md`로 작업 원칙 통합

### 호환성

- 새로운 가챠 분석 기능이나 지표는 추가하지 않음
- 가챠 확률 계산 Core와 기존 LocalStorage 데이터 구조는 유지
- 정적 GitHub Pages 및 Vanilla JavaScript MVVM 구조 유지

---

## v1.10.0.1 (2026-03-17) - 무돌 분석 버그 수정

### 버그 수정

- **시즌 페스 무돌 계산에 freeGemValue/ticketValue 미반영**: `calculateSeasonFesRainbowPrice`가 무료돌 가치 비율과 티켓 가치를 무시하고 고정값으로 계산하던 문제 수정
- **ticketValue 변경 시 무돌 분석 미갱신**: 티켓 가치 변경 시 페스 테이블만 재렌더링되고 무돌 분석 테이블은 갱신되지 않던 문제 수정
- **무돌 분석 설명 텍스트 개선**: 설명을 공통/정규화/패키지/시즌페스 4줄 구조로 개편, 논리적으로 부정확한 "상쇄" 표현 제거

### 문서

- `docs/PAYMENT.md`: ASOBI 상시 패키지 유료돌/무료돌 수치 분리 표기, 전체 "돌" → "유료돌"/"무료돌" 구분 표기
- `docs/PAYMENT_NOTES.md` 신규: iOS 무돌 전용 패키지 미확인 데이터, 시즌 페스 순환 의존성 문제 및 향후 개선 방향 기록

### 파일 변경

- `js/model/payment/PaymentModel.js`: `calculateSeasonFesRainbowPrice`에 `freeGemValue`/`ticketValue` 반영
- `js/viewmodel/payment/PaymentViewModel.js`: `ticketValue` 구독에 `renderRainbowCrystalAnalysis()` 추가
- `js/view/payment/PaymentView.js`: 무돌 분석 설명 텍스트 개선
- `docs/PAYMENT.md`: 유료돌/무료돌 표기 분리
- `docs/PAYMENT_NOTES.md`: 신규 생성

---

## v1.10.0 (2026-03-12) - 과금 패키지 비교표 전면 개편

### 새로운 기능

**1. 패키지 비교표 구조 개편**
- **공통 유료돌 열 추가**: 플랫폼별로 분산되어 있던 유료돌 표시를 `공통` 열로 통합
  - ASOBI/Android/iOS의 유료돌 수가 동일함을 명확히 표현
- **ASOBI 무료돌 열 추가**: ASOBI 전용 추가 무료돌을 별도 열로 표시
- **차이값 열 추가**: iOS 가격 - ASOBI 가격을 별도 열로 표시, 통화 토글(¥/₩)과 연동
- `PaymentConfig.js`: ASOBI NORMAL 패키지를 `paidGems`(유료돌)와 `freeGems`(추가 무료돌)로 분리

**2. 가치 설정 섹션 신설**
- 기존 페스 탭의 "티켓 가치" 입력을 독립 섹션으로 이동
- **무료돌 가치** (유료돌 100당): 무료돌의 유료돌 환산 비율 설정
- **티켓 가치** (무료돌 250당): 페스 티켓 가치 설정
- `PaymentModel.js`: `freeGemValue` Observable 추가, `toJSON`/`fromJSON` 직렬화 포함

**3. 효율 계산에 무료돌 가치 반영**
- `effectiveGems = paidGems + freeGems × (freeGemValue / 100)` 공식 적용
- `_getBaselineEfficiency`, `_renderPackageRow` 모두 반영
- `freeGemValue` 변경 시 패키지 테이블 실시간 재렌더링

**4. UI 컴포넌트 개선 - subsection-group.no-title**
- 타이틀 없는 subsection-group용 CSS modifier 클래스 추가
  - `margin-top: 8px` (기존 15px의 절반), `padding-top: 12px` (기존 15px → 12px)
- 3성/생일/콜라보/2성 사용자 설정 및 과금 가치 설정에 적용

### 버그 수정

- **All 모드에서 기타 열 항상 숨김**: `cell-extras` TD 3곳에 `hide-simple` 하드코딩 → `${simpleClass}` 조건부 클래스로 수정

### 게임 데이터 업데이트

- `docs/GAME_RULES.md`: 날개 누진 구간별 소요량 테이블 추가
  - 3성 → 4성: 200개, 4성 → 5성: 300개 (합계 500개)
  - 카드별 리셋, 무료 획득 날개 미포함 기준 명확화

### 파일 변경

- `js/config/PaymentConfig.js`: ASOBI NORMAL 패키지 `paidGems`/`freeGems` 분리, `FREE_GEM_VALUE` INPUTS 추가
- `js/model/payment/PaymentModel.js`: `freeGemValue` Observable 추가, 무돌 역산 계산에 반영
- `js/view/payment/PaymentView.js`: 테이블 구조 개편 (공통 유료돌, 무료돌, 차이값 열), 기타 열 표시 버그 수정
- `js/viewmodel/payment/PaymentViewModel.js`: `freeGemValue`/`ticketValue` 입력 바인딩 추가
- `index.html`: 가치 설정 섹션 추가, 가챠 4종 + 과금 사용자 설정에 `subsection-group.no-title` 적용
- `css/common.css`: `.subsection-group.no-title` CSS modifier 추가
- `docs/GAME_RULES.md`: 날개 한계돌파 구간별 소요량 추가

---

## v1.9.10 (2026-03-04) - 저격/아무나 모드, PJ 가챠 확률 개선

### 새로운 기능

**1. 저격/아무나 토글 버튼 (3성 가챠)**
- "픽업 수" 입력란 라벨에 토글 버튼 추가
  - **저격** (기본): M명의 특정 픽업을 올 컴플릿하는 확률 계산
  - **아무나**: N명 중 M명 이상을 어떤 조합이든 획득하는 확률 계산
- `ProbabilityEngine.runSinglePull/runRandomTicket`: `capacity` 파라미터 추가
  - any 모드: `capacity=N` → N-k 잔여 기준 전이 확률 계산
  - snipe 모드: `capacity=null` → 기존 M-k 기준 동작 유지
- `EfficiencyCalculator._simulate3Star/calculate3Star/calculate3StarCDF`: `targetMode` 전파
- `GachaResultView`: 결과 텍스트에 모드 표시 (`N픽업 중 M픽업 저격` / `N픽업 중 아무나 M픽업 이상`)

**2. RainbowCrystalCalculator - step2_10thRates 동적 계산**
- 기존 고정값(`★★★10%, ★★56%, SSR6%, SR28%`)에서 입력 확률 기반 동적 계산으로 변경
- 법칙: ★★★/SSR 각 2배, 나머지(1 - ★★★×2 - SSR×2)를 ★★:SR = 2:1 비율로 배분
- PJ 가챠(★★★ 7.5% 기준) 무돌 탭에서 Step2/3 10회째 확정枠 확률이 올바르게 표시됨

**3. 프리셋 rainbow 확률 기본값 연동**
- 정규/PJ 프리셋 클릭 시 무돌 탭의 확률 입력값도 해당 가챠 기본값으로 적용
- Step4 확정枠: `isPJ` 판별(`p3star >= 0.075`)로 PJ는 100%, 정규는 60%+SSR40% 표시

### 버그 수정

- **정규 가챠 프리셋 `step4Rate` 수정**: 40% (개별 20% × 2픽업 = 총 40%)
- **`star3-targetMode-btn` 클릭 불가 수정**: 버튼을 `<label>` 내부에서 외부(`<span class="label-with-btn">`)로 이동. `<button>`이 `<label>` 안에 있을 때 발생하는 브라우저 클릭 이벤트 충돌 해결

### 파일 변경

- `css/gacha.css`: `.mode-tag-btn`, `.label-with-btn` 스타일 추가
- `index.html`: targetMode 버튼을 `<span class="label-with-btn">` 구조로 변경
- `js/model/gacha/Star3GachaModel.js`: `targetMode` Observable 추가
- `js/viewmodel/gacha/Star3GachaViewModel.js`: 토글 버튼 바인딩, any/snipe 분기 계산, 프리셋 rainbow 적용
- `js/core/ProbabilityEngine.js`: `runSinglePull`, `runRandomTicket`에 `capacity` 파라미터 추가
- `js/core/EfficiencyCalculator.js`: `_simulate3Star`, `calculate3Star`, `calculate3StarCDF`에 `targetMode` 전파
- `js/core/RainbowCrystalCalculator.js`: `step2_10thRates(rates)` 동적 계산으로 변경
- `js/config/GachaConfig.js`: 프리셋에 `rainbow` 기본값 추가, 정규 `step4Rate` 수정
- `docs/GACHA_SYSTEM.md`: PJ 가챠 배율표, 확정枠 분배 규칙, 픽업 확률 구조 설명 추가
- `docs/GAME_RULES.md`: 날개(Wings) 시스템, 무돌-날개 교환 누진표 추가

---

## v1.9.9 (2026-03-02) - 컴포넌트 구조 정리

### 리팩토링

**1. gachaLogic → CollapsibleSection 활용 통일**
- `GachaBaseView._updateText()` 내 수동 collapsible 처리 코드 제거
- `CollapsibleSection.initSection(container)` 정적 메서드 추가
  - 동적으로 innerHTML이 교체된 후 단일 컨테이너의 접힘/펼침 상태를 복원
  - `data-collapsed` 속성값을 읽어 btn 텍스트·content 표시 동기화
- `#gachaLogic`에 `data-collapsed="true"` 명시 (초기 상태를 HTML에 선언적 표기)

**2. 천장/랜덤/Step4 버튼 → 무돌 탭에서 숨김**
- `GachaViewConfig.js` star3 `buttonVisibility` 수정
  - collection/total/efficiency 탭: 천장/랜덤/Step4 버튼 포함
  - rainbow(무돌) 탭: `star3-rainbow-10th` 버튼만 표시
  - `applyTabVisibility()` 가 나머지를 자동 숨김 처리

### 파일 변경

- `js/component/CollapsibleSection.js`: `static initSection(container)` 추가
- `js/view/gacha/GachaBaseView.js`: `CollapsibleSection` import, `_updateText()` 수동 코드 → `initSection()` 위임
- `js/view/gacha/GachaViewConfig.js`: star3 `buttonVisibility` 천장/랜덤/Step4 항목 추가
- `index.html`: `#gachaLogic`에 `data-collapsed="true"` 추가

---

## v1.9.8 (2026-03-01) - 페스 탭 추가 및 UI 공통 정리

### 새로운 기능

**1. 과금 효율 > 페스 탭 추가**
- 시즌 페스 / 로그인 페스 패키지 비교표 (ASOBI, Android, iOS)
- 원화/엔화 토글, 효율(x배) 배수 표시 (셀 클릭으로 기준 변경)
- 로그인 페스가 시즌 페스보다 위에 표시되도록 순서 조정

**2. 과금 효율 > 무돌 탭: 시즌 페스 행 추가**
- ASOBI(2,250돌/165개) vs iOS(2,000돌/150개) 차이를 이용해 15개 무돌 단가 역산
- 무료돌 단가 정규화 기준으로 계산

**3. paymentSummary 추가**
- 과금 효율 섹션에 `#paymentSummary` 추가 (가챠의 `#gachaSummary`와 동일한 패턴)
- `#payment-result-area` aside: `section-result-container` 클래스 적용

### 리팩토링

**1. result-options-header → option-button-container**
- `.result-options-header` → `.option-button-container`로 이름 변경
- `gacha.css` → `common.css`로 이동 (가챠/과금 공용)
- 가챠 섹션 4곳 적용, 과금 섹션 인라인 `margin-bottom` 제거 후 적용

**2. 결과 컨테이너 CSS 공용화**
- `.gacha-result-container` → `.section-result-container`로 변경
- `gacha.css` → `common.css`로 이동

### 파일 변경

- `css/common.css`: `.option-button-container`, `.section-result-container` 추가, 모바일 미디어쿼리 적용
- `css/gacha.css`: `.result-options-header`, `.gacha-result-container` 제거
- `index.html`: `option-button-container` 전면 적용, `paymentSummary` aside 추가
- `js/config/PaymentConfig.js`: `FES_PACKAGES` LOGIN/SEASON 순서 변경
- `js/model/payment/PaymentModel.js`: `calculateSeasonFesRainbowPrice()` 추가
- `js/view/payment/PaymentView.js`: `renderFesTable()` 추가, `renderRainbowCrystalAnalysis()` 시즌 행 추가
- `js/viewmodel/payment/PaymentViewModel.js`: `bindFesToggle()`, `bindFesTableClick()`, `renderFesTable()` 추가
- `docs/PAYMENT.md`: 신규 (패키지/결제 규칙/페스 정보 이전)
- `docs/GAME_RULES.md`: 패키지 섹션 PAYMENT.md 참조로 교체

---

## v1.9.7 (2026-02-27) - 무돌 탭 결과 표시 개선 및 구조 정리

### 리팩토링

**1. ResultView → GachaBaseView 이름 변경 및 디렉토리 이동**
- `js/view/ResultView.js` → `js/view/gacha/GachaBaseView.js`로 이동 및 클래스명 변경
- 가챠 전용 뷰임을 명확히 하기 위해 `gacha/` 서브디렉토리로 격하
- `GachaResultView`: `extends ResultView` → `extends GachaBaseView`로 갱신

**2. ID/class 네이밍 정리**
- 가챠 전용 요소에 붙은 `global` 접두사를 의미에 맞게 변경:
  - `#globalSummary` → `#gachaSummary`, `#globalLogic` → `#gachaLogic`
  - `#shared-result-area` → `#gacha-result-area`
  - `.shared-result-container` → `.gacha-result-container`
- 페이지 수준 요소:
  - `#global-header` → `#app-header`, `#global-footer` → `#app-footer`

**3. CSS 책임 분리**
- `.reference-info` / `.reference-caution`: 구조 스타일 제거, 폰트 전용으로 간소화
- 신규 `.result-box`: 박스 구조(padding, border-left, border-radius, background) 담당
- `PaymentView.js`: 두 `reference-info` 문장을 `<div class="result-box">`로 래핑

**4. StorageManager import 경로 롤백**
- `main.js`: `./model/utils/StorageManager.js` → `./utils/StorageManager.js`

### 새로운 기능

**1. 무돌 탭 결과 표시 재설계**
- "1회 기대값" / "10연 기대값" rainbow-card 제거
- `gachaSummary`를 메인 결과 영역으로 활용:
  - 횟수 결과 (일반 N회 → XX개 / 스탭업 N회 → XX개 / 합계)
  - 확률 참조표: 구간별 확률 및 기대 무돌 수치 (`data-table` 형식)
- 확률 참조표 구간: 통상 1~9회, 통상 10회째 확정, Step3 1~9회, Step2/3 10회째 확정, Step4 40회째 확정
- Step4 40회째 주의사항: P+S카드 동시 중복 시 50무돌이나 25무돌로만 산정함을 `reference-caution`으로 명시
- 스탭업 행을 스탭업 횟수 입력 여부와 무관하게 항상 표시

**2. 무돌 탭 레이아웃 개선**
- `rainbow-tab-layout`: 전체 너비(100%) 사용으로 변경
- `rainbow-input-panel`: P카드/S카드 확률 입력란을 가로(50%/50%) 배치
- 모바일에서는 P카드/S카드 세로 배치 유지

**3. data-table 모바일 스크롤**
- 확률 참조표를 `.table-scroll` div로 래핑 → 모바일에서 X축 스크롤 발생, 텍스트 2줄 방지

### 버그 수정

**1. 3성 스탭업 Step2/3 10회째 확률 오류 수정**
- `RainbowCrystalCalculator.step2_10thRates()`: 계산값 대신 게임 고정값으로 교체
  - 수정 전: 통상 확률에서 P→★★★, S→SSR로 몰아서 반환 (25개로 과다 계산)
  - 수정 후: 실측값 `{p3star:0.10, p2star:0.56, pSSR:0.06, pSR:0.28}` → 기대값 8.2개
- `GACHA_SYSTEM.md`: Step 10회째 확률 표 전면 수정 (Step1~4 실측값 반영)

### 파일 변경

- `js/main.js`: StorageManager import 경로 롤백
- `js/view/gacha/GachaBaseView.js`: 신규 (ResultView.js에서 이동)
- `js/view/gacha/GachaResultView.js`: GachaBaseView 상속으로 변경
- `js/view/payment/PaymentView.js`: result-box 래핑 추가
- `js/viewmodel/gacha/Star3GachaViewModel.js`: renderRainbowTab 재설계, _buildProbTable/_buildResultCounts 분리
- `js/viewmodel/gacha/Star2GachaViewModel.js`: gachaSummary ID 갱신
- `js/view/gacha/GachaViewConfig.js`: gachaSummary/gachaLogic ID 갱신
- `js/core/RainbowCrystalCalculator.js`: step2_10thRates 게임 고정값으로 수정
- `css/common.css`: result-box 신규, reference-info/caution 폰트 전용화, app-header/footer
- `css/gacha.css`: summary 간소화, rainbow-tab-layout/input-panel 레이아웃 개선, table-scroll/result-counts/logic-table-confirm 추가
- `index.html`: ID/class 전면 갱신
- `.gitignore`: `**/docs/**/*.png` 추가 (스크린샷 추적 제외)
- `docs/GACHA_SYSTEM.md`: Step 확률 표 및 기대값 수정

---

## v1.9.6 (2026-02-26) - 무돌 탭 재설계 및 버그 수정

### 새로운 기능

**1. 무돌(虹の結晶) 탭 완전 재설계**
- 기존 차트 제거, 카드형 결과 UI로 교체
- P카드(3성/2성/1성), S카드(SSR/SR/R) 확률 직접 입력 가능 (기본값: 게임 확률)
- 소수점 3자리까지 입력 지원, InputBinder/Observable 연동
- 결과: 1회 기대값 / 10연 기대값 / 총 기대값 (N회) 카드형 표시
- "2/SR확정" 토글 버튼 추가 (result-options-header 배치): 10연 보정 포함/미포함 전환
- 상세 계산 근거: 가챠 횟수, 2/SR확정 여부, 등급별 확률×배율=기대값 수치 표시

**2. 가챠 시스템 문서 분리**
- `docs/GACHA_SYSTEM.md` 신규 생성: 가챠 시스템 전용 상세 사양 문서
  - 3성/2성/생일/콜라보 스탭업 구조를 Step별 확률 표로 정리
  - 무돌 배출 확률표, 10회째 보정, 기대값 계산 예시 포함
- `docs/GAME_RULES.md`: 가챠 섹션 제거 후 GACHA_SYSTEM.md 링크로 교체

### 버그 수정

**1. 상세 계산 근거 열림/닫힘 상태 초기화 문제**
- 버튼(모드 전환 등) 클릭으로 재렌더링 시 항상 닫힌 상태로 초기화되는 문제 수정
- `ResultView._updateText`: 재렌더링 전 열림/닫힘 상태 보존 후 복원
- 무돌 탭 `renderRainbowTab`: 동일하게 상태 보존 처리
- 영향 범위: 3성/2성/생일/콜라보 모든 탭

**2. 무돌 탭 전환 후 summary 미복원 문제**
- 무돌 탭에서 다른 탭으로 이동 시 summary가 hidden 상태로 유지되는 문제 수정
- `ResultView._updateText`: summary 갱신 시 `display` 명시적 복원

**3. 2성 가챠 일반 vs 스탭업 차트 오류**
- `GachaResultView._renderEfficiencyTab`에서 `model.targetProbability`가 없는 타입(Star2)에서 오류 발생 수정
- `model.targetProbability?.value ?? null` 방어적 참조로 수정

### 파일 변경

- `js/view/ResultView.js`: 열림/닫힘 상태 보존, summary display 복원
- `js/view/gacha/GachaResultView.js`: targetProbability 방어적 참조
- `js/viewmodel/gacha/Star3GachaViewModel.js`: 무돌 탭 renderRainbowTab / _buildRainbowLogicDetail
- `js/core/Constants.js`: APP_VERSION 1.9.6
- `index.html`: 캐시 버스팅 ?v=1.9.6
- `docs/GACHA_SYSTEM.md`: 신규 생성
- `docs/GAME_RULES.md`: 가챠 시스템 섹션 분리

---

## v1.9.5 (2026-02-23) - Constants/Config 리팩토링 및 하드코딩 제거

### 아키텍처 개선

**1. Constants vs Config 분리**
- 불변 상수 (Constants.js) vs 변경 가능한 설정 (Config 파일들) 명확히 분리
- 기존 파일 재구성:
  - `GachaConstants.js` → `config/GachaConfig.js` (설정) + `Constants.js` (게임 규칙)
  - `PaymentConstants.js` → `config/PaymentConfig.js`
  - `UIConstants.js` → `config/UIConfig.js`
- 새로운 폴더 구조: `js/config/` 생성

**2. Constants.js (불변 상수)**
- `APP_VERSION`: 앱 버전 관리
- `GACHA_RULES`: 게임 시스템 규칙 (Step 주기, 천장, 확정 시스템)
- `PROBABILITY_MODE`: 확률 표시 모드 (개별/누적)
- `MATH_CONSTANTS`: 수학 상수 (EPSILON, PERCENTAGE_MULTIPLIER)
- `FORMATTING_RULES`: 소수점 자릿수 규칙

**3. Config 파일들 (변경 가능한 설정)**
- `GachaConfig.js`: 입력 설정, 프리셋, 의존성, 토글 상태
- `PaymentConfig.js`: 플랫폼별 패키지 데이터
- `UIConfig.js`: UI 포맷, 차트 스타일, Observable 기본값

### 하드코딩 제거

**1. 숫자 리터럴을 Constants로 대체**
- ❌ `value * 40` → ✅ `value * GACHA_RULES.STAR3.STEPUP_CYCLE`
- ❌ `pulls < 200` → ✅ `pulls < GACHA_RULES.STAR3.CEILING_INTERVAL`
- ❌ `epsilon = 1e-9` → ✅ `MATH_CONSTANTS.EPSILON`

**2. Chart 설정 중앙화**
- 하드코딩된 차트 범위 200 → `CHART_RANGE.RAINBOW_MAX_PULLS`
- 포인트 반지름 (4, 3, 1) → `CHART_POINT.RADIUS.*`
- 강조 간격 40 → `CHART_POINT.EMPHASIS_INTERVAL.STAR3_CYCLE`
- 폰트 크기, 패딩, 투명도 등 모든 차트 스타일 상수화

**3. Observable 기본값 통합**
- Model 초기값을 `OBSERVABLE_DEFAULTS`에서 일괄 관리
- 입력 범위 (min/max/step)를 `CONFIG.INPUTS`에서 관리
- HTML에서 하드코딩된 속성 제거 (type과 id만 유지)

### 기술적 개선

**1. Re-export 패턴 적용**
- `GachaConfig.js`가 `GACHA_RULES`, `PROBABILITY_MODE`를 re-export
- `UIConfig.js`가 `FORMATTING_RULES`를 re-export
- 하위 호환성 유지하면서 점진적 리팩토링 지원

**2. Import 경로 일괄 업데이트** (20+ 파일)
- `GachaConstants` → `GachaConfig` (8개 파일)
- `PaymentConstants` → `PaymentConfig` (1개 파일)
- `UIConstants` → `UIConfig` (13개 파일)
- 상대 경로 정확성 검증 및 수정

**3. 설계 원칙 확립**
- Single Source of Truth: Config가 모든 설정의 단일 진실 공급원
- 유연성: 설정 변경 시 한 곳만 수정
- 일관성: 동일한 값이 여러 곳에 중복 정의되지 않음

### 문서화

**1. CLAUDE.md 업데이트**
- "Constants vs Config 설계 철학" 섹션 추가
- 각 파일의 역할과 사용 예시 명시
- Observable과 InputBinder의 역할 분리 설명
- 하드코딩 금지 원칙 강조

**2. 버전 관리 체크리스트 업데이트**
- Constants.js 경로로 수정
- 캐시 버스팅 버전 예시 업데이트

### 파일 변경

**새로운 파일**:
- `js/config/GachaConfig.js` (from GachaConstants.js)
- `js/config/PaymentConfig.js` (from PaymentConstants.js)
- `js/config/UIConfig.js` (new)

**삭제된 파일**:
- `js/core/GachaConstants.js` → config로 이동
- `js/core/PaymentConstants.js` → config로 이동

**확장된 파일**:
- `js/core/Constants.js`: 27 bytes → 3,341 bytes (불변 상수 추가)

**Import 업데이트된 파일** (20+ 파일):
- ViewModel: Star3, Star2, Birthday, Collab, Payment
- Model: Star3, Star2, Birthday, Collab, Payment
- Utils: ChartAdapter, ChartUtils, Formatter, StorageManager
- Core: EfficiencyCalculator, ProbabilityEngine
- View: ResultView, GachaResultView, PaymentView

---

## v1.9.4 (2026-02-09) - 무돌 가격 분석 및 CSS 표준화

### 새로운 기능

**1. 무돌(虹の結晶) 가격 분석 테이블**
- ASOBI vs iOS 패키지 비교를 통해 무돌의 암묵적 가치 역산
- D, E, F팩 대상 분석 (무돌 포함 패키지)
- 표시 항목:
  - 패키지명 (가운데 정렬)
  - 무돌 개수
  - 전체 가격 (정수 반올림)
  - 개당 가격 (소수점 3자리)
  - 권장 구매처 (ASOBI/복합적)
- 음수 가격: 빨간색으로 강조 표시
- 통화 토글 연동 (JPY ↔ KRW)

**2. 권장 구매처 로직**
- 음수 (ASOBI 더 비쌈) → "ASOBI" (무조건 ASOBI에서 구매 유리)
- 양수 (iOS 더 비쌈) → "복합적" (무돌 가치에 따라 판단 필요)

### UI/UX 개선

**1. 패키지 비교 테이블**
- 패키지명: 왼쪽 정렬 → 가운데 정렬
- 가격에 단위 추가: `44,000` → `44,000₩`, `480` → `480¥`
- 유료돌에 단위 추가: `380` → `380돌`
- OurSTREAM 압축: `OurSTREAM×1` → `STREAM×1`

**2. 기본 통화 변경**
- 초기 통화: 엔화(¥) → 원화(₩)
- 사용자가 앱 시작 시 바로 원화로 확인 가능

### 기술적 개선

**1. CSS 표준화 및 중복 제거**
- 공통 데이터 테이블 베이스 스타일 추가 (common.css)
- `.data-table` 클래스: 모든 테이블의 공통 스타일 정의
- payment-comparison-table: 68줄 → 12줄 (84% 감소)
- rainbow-crystal-table: 54줄 → 12줄 (78% 감소)
- 총 CSS 중복 122줄 제거

**2. CSS 색상 변수 추가**
- `--error-red: #dc3545` 추가 (음수 가격 표시용)

**3. 테이블 클래스 구조**
- 모든 테이블: `<table class="data-table [specific-table]">`
- 공통 스타일 상속 + 테이블별 고유 스타일만 추가
- 유지보수성 및 일관성 향상

### 파일 변경

**새로운 파일**:
- 없음 (기존 파일 수정만)

**수정된 파일**:
- `common.css`: 공통 테이블 베이스 스타일 추가
- `payment.css`: 중복 제거, 특화 스타일만 유지
- `PaymentModel.js`: `calculateRainbowCrystalPrices()` 메서드 추가
- `PaymentView.js`: 무돌 분석 테이블 렌더링, 단위 표시 추가
- `PaymentViewModel.js`: 초기 통화 KRW 설정, 무돌 분석 통합
- `index.html`: 무돌 분석 collapsible 컨테이너 추가

---

## v1.9.3 (2026-02-08) - 과금 효율 분석 UI/UX 개선

### 새로운 기능

**1. All/Simple 뷰 모드 토글**
- Simple 모드: 기타, ¥/돌, 효율(x배) 3개 열만 표시
- All 모드: 가격, 유료돌 포함 전체 5개 열 표시
- 버튼 위치: 통화/효율 토글 앞

**2. 기준 패키지 선택 및 효율 배수 표시**
- 패키지 클릭 시 기준 패키지로 설정
- 초기 기준: ASOBI F팩
- 모든 패키지의 효율 배수(x배) 계산 및 표시
- 기준 패키지는 1.000배로 표시

**3. 플랫폼별 그룹 시각 효과**
- Hover: 같은 플랫폼의 5개(Simple 모드: 3개) 셀 동시 강조
- Selected: 외곽선으로 그룹화 표시 (내부 border 유지)
- 시각적으로 플랫폼 단위 인식 향상

### UI/UX 개선

**1. 테이블 구조 통합**
- 여러 개별 테이블 → 단일 통합 테이블
- 카테고리 구분: 구분 행으로 표시 (상시/월 주기/한정)
- 헤더 1개로 통합 (중복 제거)
- 스크롤 처리: 컨테이너 레벨에서 통합 관리

**2. 카테고리 구분 행 스타일**
- 세로 패딩: 12px → 6px (컴팩트화)
- 색상: section-title과 동일한 청록색
- Colspan: 뷰 모드에 따라 동적 조정 (All: 16, Simple: 10)

**3. 소수점 표시 개선**
- 효율 (¥/돌): 2자리 → 3자리
- 효율 배수 (x배): 2자리 → 3자리
- 계산 정확도: 반올림 전 원본 값으로 계산 (오차 최소화)

**4. 텍스트 개선**
- "효율 배수" → "효율(x배)"
- "1.25x" → "1.25배"
- 더 자연스러운 한국어 표현

### 기술적 구현

**1. 뷰 모드 전환 시스템**
```javascript
// PaymentViewModel.js
viewBtn.addEventListener('click', () => {
    const newView = currentView === 'all' ? 'simple' : 'all';
    viewBtn.dataset.view = newView;
    this.renderPackageTables();
});

// PaymentView.js
const colspan = viewMode === 'simple' ? '3' : '5';
const simpleClass = viewMode === 'simple' ? ' hide-simple' : '';
```

**2. 기준 패키지 선택**
```javascript
// PaymentModel.js
this.baselinePackage = new Observable({
    platform: 'ASOBI',
    category: 'NORMAL',
    id: 'F'
});

// 효율 배수 계산 (항상 돌/100엔 기준)
const currentEfficiency = discountedPriceJPY > 0 ? paidGems / discountedPriceJPY : 0;
const efficiencyMultiplier = baselineEfficiency > 0
    ? currentEfficiency / baselineEfficiency
    : 0;
```

**3. 플랫폼별 그룹 Hover**
```javascript
// JavaScript 이벤트 위임
container.addEventListener('mouseover', (event) => {
    const cell = event.target.closest('.platform-cell');
    const row = cell.closest('tr');
    const platformCells = row.querySelectorAll(
        `.platform-cell[data-platform="${platform}"]...`
    );
    platformCells.forEach(c => c.classList.add('hover-group'));
});

// CSS
.platform-cell.hover-group {
    background: var(--secondary-light) !important;
}
```

**4. 선택된 패키지 외곽선**
```css
/* 좌측 끝 */
.platform-cell.selected.platform-first {
    box-shadow: inset 2px 0 0 0 var(--secondary),
                inset 0 2px 0 0 var(--secondary),
                inset 0 -2px 0 0 var(--secondary);
}

/* 중간 */
.platform-cell.selected:not(.platform-first):not(.platform-last) {
    box-shadow: inset 0 2px 0 0 var(--secondary),
                inset 0 -2px 0 0 var(--secondary);
}

/* 우측 끝 */
.platform-cell.selected.platform-last {
    box-shadow: inset -2px 0 0 0 var(--secondary),
                inset 0 2px 0 0 var(--secondary),
                inset 0 -2px 0 0 var(--secondary);
}
```

### 코드 정리

**1. 사용하지 않는 코드 제거**
- `PaymentCalculator.js` 파일 삭제 (미사용)
- `BONUS_VALUES` 상수 제거 (부가 재화 가치 임의 설정 방식 폐기)
- `PLATFORM_NAMES`, `CATEGORY_NAMES`, `CURRENCY_SYMBOLS` 제거 (미사용)

**2. 설계 철학 변경**
- **기존**: 사용자가 무돌/OurSTREAM 가치를 임의 설정
- **변경**: 플랫폼 간 가격 차이로 자동 계산
- **이유**: 특정 패키지를 살 때 어느 플랫폼이 유리한지 비교하는 것이 실용적

### 파일 변경 요약

**수정 파일**:
- `index.html`: All/Simple 토글 버튼 추가
- `css/payment.css`:
  - `.hide-simple` 클래스 추가
  - 플랫폼 그룹 hover/selected 스타일
  - 카테고리 구분 행 스타일 개선
- `js/model/payment/PaymentModel.js`:
  - `baselinePackage` Observable 추가
  - toJSON/fromJSON 업데이트
- `js/view/payment/PaymentView.js`:
  - viewMode 파라미터 추가
  - colspan 동적 조정
  - simpleClass 적용
  - 소수점 3자리 (toFixed(3))
  - platform-first/platform-last 클래스 추가
- `js/viewmodel/payment/PaymentViewModel.js`:
  - 뷰 모드 토글 바인딩
  - 패키지 클릭 이벤트 (이벤트 위임)
  - 플랫폼 그룹 hover 이벤트
  - baselinePackage 구독 추가
- `js/core/PaymentConstants.js`:
  - BONUS_VALUES 제거
  - PLATFORM_NAMES, CATEGORY_NAMES, CURRENCY_SYMBOLS 제거

**삭제 파일**:
- `js/core/PaymentCalculator.js`: 미사용 파일 제거

### 성능 최적화

**1. 이벤트 처리 최적화**
- 클릭/Hover 이벤트: 이벤트 위임 사용
- `_clickHandlerBound` 플래그로 중복 바인딩 방지
- 스크롤 위치 저장/복원 (requestAnimationFrame)

**2. 계산 최적화**
- 기준 패키지 효율: 전체 테이블에서 1회만 계산
- 하위 메서드로 전달하여 재계산 방지

---

## v1.9.2 (2026-02-07) - 과금 효율 분석 Phase 1 완료

### 새로운 기능

**1. 과금 효율 분석 기본 기능 구현**

**목적**: 플랫폼별(ASOBI/Android/iOS) 패키지 비교 및 효율 계산 기능 제공

**주요 기능**:
- 엑셀 스타일 패키지 비교 테이블
  - Y축: 패키지 이름
  - X축: 플랫폼별 속성 (가격, 유료돌, 기타, 효율)
- 카테고리별 분류 (상시/월 주기/한정)
- 환율 변환 (100엔당 원화)
- 플랫폼별 할인 적용
  - 엔화 할인 (ASOBI/Android 전용, 상한 없음)
  - 원화 할인 (iOS 전용, 상한 있음 - 숨김 처리)

**2. 통화 표시 전환 기능**

**통화 토글 버튼** (`payment-toggle-currency`):
- 엔화(¥) ↔ 원화(₩) 전환
- 초기 상태: 엔화 표시
- 버튼 색상: 청록색 (secondary)
- `data-state="included"` 속성으로 스타일 적용

**효율 모드 토글 버튼** (`payment-toggle-efficiency`):
- ¥/돌 ↔ 돌/¥ 전환
- ₩/돌 ↔ 돌/₩ 전환
- 버튼 텍스트가 현재 통화에 따라 동적 변경
- 테이블 재렌더링으로 효율 계산 즉시 반영

**3. 효율 표시 개선**

**테이블 헤더** (th.header-attr):
- 전체 형식 표시: "¥/돌", "돌/¥", "₩/돌", "돌/₩"
- 효율 모드에 따라 동적 변경

**테이블 셀** (td):
- 간단한 단위만 표시: "1.79¥", "0.56돌" 등
- 효율값 소수점 2자리 표시

### UI/UX 개선

**1. CSS 구조 정리**

**CSS Reset 추가** (common.css:88-272):
- normalize.css 기반 CSS Reset 적용
- 브라우저 간 일관된 렌더링 보장
- Box Sizing, 헤딩/단락 리셋 포함

**공통 컴포넌트 통합** (common.css):
- gacha.css와 payment.css의 중복 제거
- 공통 버튼 스타일 통합
  - `.preset-btn`: 프리셋 버튼
  - `.reset-btn`: 리셋 버튼
  - `.view-toggle-btn`: 뷰 토글 버튼
- 공통 섹션 컴포넌트
  - `.tab-content`: 탭 콘텐츠
  - `.collapsible-container`: 접을 수 있는 섹션
  - `.subsection-group`: 하위 섹션 그룹
- `.category-title` 클래스 추가 (패키지 비교표 제목용)

**2. 반응형 디자인**

**모바일 환경** (@media max-width: 650px):
- 폰트 크기 자동 조정
- 입력 필드 크기 최적화
- 테이블 가로 스크롤 지원

### 기술적 구현

**1. MVVM 아키텍처**

**PaymentModel.js**:
```javascript
- exchangeRate: Observable(950)        // 100엔당 원화
- jpyDiscountRate: Observable(0)       // 엔화 할인율 (%)
- krwDiscountRate: Observable(0)       // 원화 할인율 (%)
- krwDiscountCap: Observable(10000)    // 원화 할인 상한 (숨김)

메서드:
- applyJPYDiscount(basePrice)          // 엔화 할인 적용 (상한 없음)
- applyKRWDiscount(basePrice)          // 원화 할인 적용 (상한 있음)
- convertToKRW(jpy)                    // 엔화→원화 변환
```

**PaymentViewModel.js**:
```javascript
- bindInputs()                         // InputBinder로 양방향 바인딩
- subscribeToModel()                   // Observable 변경 시 재계산
- bindCurrencyToggle()                 // 통화/효율 토글 버튼 바인딩
- updateEfficiencyButtonText()         // 효율 버튼 텍스트 동적 업데이트
- toggleCurrency(currency)             // 통화 표시 전환 (CSS 클래스)
- renderPackageTables()                // 테이블 렌더링 + 통화 상태 복원
```

**PaymentView.js**:
```javascript
- renderPackageTable(packageData, model)       // 전체 테이블 렌더링
- _renderCategoryTable(category, ...)          // 카테고리별 테이블
- _renderTableHeader(efficiencyMode)           // 헤더 (전체 형식)
- _renderPackageRow(pkgId, category, ...)     // 패키지 행 (간단 형식)
- _formatExtras(pkg)                           // 기타 재화 포맷팅
```

**2. 플랫폼별 가격 계산**

**iOS (원화 기준)**:
```javascript
const basePriceKRW = pkg.price;
const discountedPriceKRW = model.applyKRWDiscount(basePriceKRW);
const basePriceJPY = Math.round((basePriceKRW / model.exchangeRate.value) * 100);
const discountedPriceJPY = Math.round((discountedPriceKRW / model.exchangeRate.value) * 100);
```

**ASOBI/Android (엔화 기준)**:
```javascript
const basePriceJPY = pkg.price;
const discountedPriceJPY = model.applyJPYDiscount(basePriceJPY);
const basePriceKRW = Math.round((basePriceJPY / 100) * model.exchangeRate.value);
const discountedPriceKRW = Math.round((discountedPriceJPY / 100) * model.exchangeRate.value);
```

**3. 효율 계산 로직**

```javascript
if (efficiencyMode === 'price-per-gem') {
    // ¥/돌, ₩/돌 모드
    efficiency = paidGems > 0 ? discountedPrice / paidGems : 0;
    unit = currency === 'JPY' ? '¥' : '₩';
} else {
    // 돌/¥, 돌/₩ 모드
    efficiency = discountedPrice > 0 ? paidGems / discountedPrice : 0;
    unit = '돌';
}
```

**4. LocalStorage 저장**

**저장 키**: `shani_payment_config`

**저장 데이터**:
```javascript
{
    exchangeRate: 950,
    jpyDiscountRate: 0,
    krwDiscountRate: 0,
    krwDiscountCap: 10000
}
```

### 파일 변경 요약

**신규 파일**:
- `js/model/payment/PaymentModel.js`: 과금 데이터 모델
- `js/viewmodel/payment/PaymentViewModel.js`: 프레젠테이션 로직
- `js/view/payment/PaymentView.js`: UI 렌더링
- `js/core/PaymentConstants.js`: 패키지 데이터 및 설정
- `css/payment.css`: 과금 섹션 전용 스타일

**수정 파일**:
- `index.html`:
  - payment-section 구현 (입력 필드, 토글 버튼, 테이블 컨테이너)
  - 통화/효율 토글 버튼에 `data-state="included"` 추가
  - "할인 상한 (원)" 필드 숨김 처리
- `css/common.css`:
  - normalize.css 기반 CSS Reset 추가 (88-272줄)
  - gacha.css/payment.css 중복 제거 및 통합
  - `.category-title` 클래스 추가
  - 공통 버튼 스타일 통합
- `css/gacha.css`:
  - common.css로 이동한 중복 제거
  - 섹션 번호 재정렬 (2-10)
- `css/payment.css`:
  - `.category-title` 중복 제거 (common.css 사용)
  - 엑셀 스타일 테이블 스타일
  - 통화별 열 숨김 클래스 (`.hide-krw`, `.hide-jpy`)
- `js/main.js`:
  - PaymentViewModel 초기화 및 섹션 등록

### 제거된 기능

**재화 가치 환산 로직 완전 제거**:
- `rainbowCrystalValue` (무돌 가치)
- `ourstreamValue` (OurSTREAM 가치)
- `calculateEffectiveGems()` 메서드
- "재화 가치 환산" 서브섹션 HTML

**이유**: 무돌 가치는 ASOBI vs iOS 가격 차이로 결정되므로 별도 입력 불필요

### 향후 계획

**Phase 2 (v1.9.3 예정)**:
- 효율 순위 표시 (플랫폼별 Best Deal 강조)
- 손익분기점 분석 (월 주기 vs 상시 비교)
- 차트 시각화 (효율 비교 차트)
- 패키지별 필터링 (카테고리 선택)

**Phase 3 (v1.9.4 예정)**:
- 커스텀 패키지 추가 기능
- 할인 시나리오 저장/불러오기
- PDF 리포트 생성

---

## v1.9.1 (2026-02-07) - SPA 구조 전환 및 UI/UX 개선

### 새로운 기능

**1. Multi-Section SPA 구조 도입**

**목적**: 가챠 계산 외에 과금 효율 등 추가 기능 확장을 위한 아키텍처 준비

**주요 변경사항**:
- Single Page Application (SPA) 패턴 적용
- 섹션별 display 토글 방식으로 전환
- 브라우저 히스토리 API 연동 (URL 해시 기반)

**구현 내용**:
- **SectionManager.js** (신규 생성):
  - 섹션 간 전환 관리 (가챠 계산 ↔ 과금 효율)
  - 브라우저 히스토리 관리 (뒤로가기/앞으로가기 지원)
  - URL 해시 기반 네비게이션 (#gacha, #payment)

- **HTML 구조 개편**:
  - 전역 aside 사이드바 추가 (PC: 고정 좌측, 모바일/태블릿: 상단)
  - `#gacha-section` 및 `#payment-section` 래핑
  - `#app-container` 도입으로 섹션 관리 계층 분리
  - 헤더 숨김 처리 (사이드바로 네비게이션 통합)

- **CSS 분할**:
  - `common.css`: 재사용 가능한 공통 스타일 (CSS 변수, 레이아웃, 사이드바)
  - `gacha.css`: 가챠 도메인 특화 스타일 (탭, 입력, 차트)

**2. 반응형 사이드바 네비게이션**

**Desktop (>768px)**:
- 고정 좌측 사이드바 (200px)
- 아이콘 + 텍스트 가로 배치
- body에 `margin-left: 200px` 적용

**Tablet (651-768px)**:
- 상단 네비게이션 바 (static)
- 아이콘 + 텍스트 가로 배치, 가운데 정렬
- 전체 너비 사용

**Mobile (≤650px)**:
- 상단 네비게이션 바
- 아이콘 + 텍스트 가로 배치, 가운데 정렬
- 작은 폰트 크기 (0.8rem)

### UI/UX 개선

**1. CollapsibleSection 리팩토링**

**문제**: 기존 토글 버튼이 동적으로 생성되는 "상세 계산 근거" 섹션에서 작동하지 않음

**해결**:
- **data-attribute 기반 관리**:
  - `data-collapsible="true"`: collapsible 컨테이너 명시
  - `data-toggle-section`: 토글 버튼 명시
  - `data-collapsed`: 접힌/펼친 상태 추적

- **초기화 로직 추가**:
  - `initAllSections()`: 페이지 로드 시 모든 섹션 초기 상태 설정
  - 동적 HTML 삽입 후 자동 초기화 지원

- **이벤트 위임 개선**:
  - `closest('[data-toggle-section]')`로 정확한 버튼만 타겟팅
  - 전역 body 이벤트 리스너로 동적 요소 지원

**적용 범위**:
- 정적 HTML: 9개 섹션 (가챠 정보, 사용자 설정 등)
- 동적 HTML: "상세 계산 근거" (3성/생일/콜라보/2성 각각)

**2. 입력 필드 배경색 개선**

- `--bg-input` 변수: `#f9f9f9` → `#ffffff` (순백색)
- 모든 `input[type="number"]`와 `select` 요소에 적용
- 깔끔하고 명확한 시각적 구분

**3. 모바일 폰트 크기 조정**

- 모바일 환경 (`@media (max-width: 650px)`)에서:
  - `input`, `select` 폰트 크기를 `label`과 동일하게 조정 (0.8rem)
  - 일관된 타이포그래피로 가독성 향상

### 기술 부채 해결

**1. 동적 HTML과 이벤트 리스너 분리**

**기존 문제**:
- ResultView에서 생성한 "상세 계산 근거" HTML에 인라인 `style="cursor: pointer;"` 사용
- 이벤트 리스너가 CollapsibleSection에 집중되지 않음

**개선**:
- GachaResultView.js의 모든 동적 HTML에 `data-toggle-section` 추가
- ResultView.js에서 HTML 삽입 후 초기 상태 설정
- 인라인 스타일 제거, CSS 클래스 기반 관리

**2. 타이틀 및 메타데이터 업데이트**

- `<title>`: "샤니송 픽업 확률 계산기" → "샤니송 유틸리티"
- 다목적 툴로서의 정체성 반영

### 파일 변경 요약

**신규 파일**:
- `js/core/SectionManager.js`: 섹션 전환 및 히스토리 관리
- `css/common.css`: 공통 스타일 (CSS 분할)

**수정 파일**:
- `index.html`:
  - 사이드바 추가, 섹션 구조 개편
  - 9개 collapsible-container에 `data-collapsible` 추가
  - payment-section 더미 추가
  - `<title>` 변경
- `css/gacha.css`:
  - 가챠 전용 스타일 분리
  - 모바일 input/select 폰트 크기 조정
  - 충돌하는 미디어 쿼리 제거
- `css/common.css`:
  - 사이드바 반응형 스타일
  - `--bg-input` 색상 변경
- `js/view/component/CollapsibleSection.js`:
  - 완전 리팩토링 (data-attribute 기반)
  - `initAllSections()`, `updateButtonText()` 메서드 추가
- `js/view/ResultView.js`:
  - 동적 HTML 삽입 후 collapsible 초기화
- `js/view/gacha/GachaResultView.js`:
  - 3개 로직 생성 메서드에 `data-toggle-section` 추가
- `js/main.js`:
  - SectionManager 초기화 추가
- `js/core/GachaConstants.js`:
  - APP_VERSION: '1.9.0' → '1.9.1'

### 향후 계획

- Phase 2: 과금 효율 분석 기능 구현
- Phase 3: 섹션별 독립 ViewModel 구조 확립

---

## v1.9.0 (2026-02-07) - 콜라보 가챠 추가 및 아키텍처 재구성

### 새로운 기능

**1. 콜라보 가챠 분리**

**기존**: "생일/본가(2탄)" 통합 탭
**변경**: "생일"과 "콜라보" 분리

**생일 가챠**:
- 프리셋 제거 (생일 전용 고정 설정)
- 픽업 개수: 1개 고정
- 일반 확률: 1.5% 고정
- 스탭업 확률: 2.0% 고정
- 스탭업 최대 횟수: 30회로 제한 (기존 9999회)
- Step3 확정: 항상 ON

**콜라보 가챠** (신규):
- 프리셋 기능 유지
- 본가(2탄) 프리셋 추가
  - 픽업 개수: 5개
  - 일반 확률: 0.75%
  - 스탭업 확률: 1.0%
  - Step3 확정: OFF
- 스탭업 최대 횟수: 9999회 (제한 없음)

### 주요 변경사항

**1. 버전 관리 시스템 구축** (StorageManager.js):
- `APP_VERSION = '1.9.0'` 도입
- `VERSION_CONFIG`를 통한 마이그레이션 정의
- 버전 업그레이드 시 생일 가챠 localStorage 자동 초기화
- 간접 참조 방식으로 CONFIG 기반 마이그레이션

**2. 생일 가챠 고정값 적용** (BirthdayGachaViewModel.js):
- `FIXED_VALUES`를 GachaConstants에서 로드
- `applyFixedValues()`: LocalStorage 로드 전 고정값 강제 적용
- `disableFixedInputs()`: 고정 필드 비활성화 (회색 배경, not-allowed 커서)
- 프리셋 기능 제거 (initPresets, applyPreset 삭제)
- 저격 픽업 수 입력 필드 숨김 처리

**3. 콜라보 가챠 신규 추가**:
- CollabGachaModel.js (신규 생성)
- CollabGachaViewModel.js (신규 생성)
  - Step3 확정 기능 제거 (확률만 증가)
  - 프리셋 기능 유지 (본가(2탄) 프리셋 포함)
  - 스탭업 제한 없음 (9999회)
- HTML: tab-collab 섹션 추가 (차트, 토글 버튼 포함)
- GachaTypeConfig.js: collab 설정 추가

**4. 코드 체계화** (EfficiencyCalculator.js, GachaResultView.js):
- 스탭업 가챠 타입 분류에 따른 메서드명 개선
  - Type A (3성): 주회 보상 시스템형
  - Type B (생일/콜라보): 단순 확률 증가형
  - Type C (2성): 그룹별 확정 시스템형
- `calculateBirthday` → `calculateSimpleStepup`
- `_generateBirthdayLogic` → `_generateSimpleStepupLogic`
- 각 타입별 주석 추가로 명확한 분류

**5. 공유 설정 시스템** (SharedSettings.js):
- targetProbability를 3성/생일/콜라보 간 공유
- 싱글톤 패턴으로 구현
- LocalStorage에 단일 키로 저장 (`shani_gacha_shared`)
- 한 탭에서 목표 확률 변경 시 다른 탭에도 자동 반영

**6. 아키텍처 재구성**:
- `core/Observable.js` → `utils/Observable.js` (범용 유틸리티로 분류)
- `model/SharedSettings.js` → `core/SharedSettings.js` (도메인 서비스로 분류)
- 폴더 구조 기준 명확화 (CLAUDE.md에 문서화)
  - `utils/`: 프로젝트 간 재사용 가능 (도메인 독립)
  - `core/`: 앱 특화 도메인 로직
  - `model/`: 도메인 엔티티 (데이터 구조)

**파일 변경 요약**:
- **신규**: CollabGachaModel.js, CollabGachaViewModel.js, SharedSettings.js
- **이동**: Observable.js (core → utils), SharedSettings.js (model → core)
- **수정**: GachaConstants.js, StorageManager.js, BirthdayGachaViewModel.js, BaseGachaViewModel.js
- **수정**: index.html (collab 섹션, 탭 네비게이션)
- **수정**: style.css (탭 네비게이션 스타일, 모바일 폰트 크기)
- **수정**: main.js (collab 초기화, 탭 이벤트 리스너)
- **수정**: GachaResultView.js (collab 렌더링, 메서드명 개선, 30일 제한 안내)
- **수정**: EfficiencyCalculator.js (메서드명 개선, stepupLimit 파라미터 추가)
- **수정**: CLAUDE.md (폴더 구조 기준 추가)

---

## v1.8.2 (2026-01-29) - UI/UX 개선 및 버그 수정

### 버그 수정

**1. 동적 max 값 초기화 버그 수정**

**문제**:
- 페이지 최초 로딩 시 `stepPulls`의 max 값이 `maxLoops * 40`이 아닌 기본값 80으로 고정
- 3성, 2성 가챠 모두 동일한 문제 발생

**원인**:
- `applyDependencies()`가 `super.init()` **전**에 호출됨
- LocalStorage 로드(`fromJSON()`) 전에 의존성 handler 실행
- `maxLoops`가 기본값(2)일 때 `stepMax = 80` 설정됨

**해결** (BaseGachaViewModel.js:13-20, Star3GachaViewModel.js:30-31, Star2GachaViewModel.js:29-30):
- `applyDependencies()`를 `fromJSON()` **이후**, `bindInputs()` **전**에 실행하도록 순서 변경
- 초기값 즉시 적용: handler를 구독 전에 1회 실행하여 초기 의존성 반영

**2. 생일 가챠 DEPENDENCIES 형식 통일** (GachaConstants.js:72-81):
- 구형 형식 `{ id, max }` → 신규 형식 `{ source, handler }`로 변경
- `pickupCount` 변경 시 `targetCount` 자동 클램프

### UI/UX 개선

**1. 입력 섹션 구조 개편** (index.html, style.css)

**변경 전**:
- "기본 정보" + "스탭업 정보" 2개의 독립 섹션
- 각 섹션마다 토글 버튼(▼) 존재

**변경 후**:
- **"가챠 정보"** 1개 섹션으로 통합
  - 내부에 "기본 정보" subsection
  - 내부에 "스탭업 정보" subsection
- 토글 버튼은 최상위 섹션에만 1개
- subsection-group으로 시각적 그룹핑 (회색 배경, 패딩)

**적용 범위**: 3성, 생일/본가(2탄), 2성 모든 가챠 타입

**2. 타이틀 태그 통일** (index.html)
- `<p class="section-title">` → `<h3 class="section-title">`
- `<h4 class="subsection-title">` 유지
- 시맨틱 HTML 계층 구조 준수 (h3 > h4)

**3. 스타일 일관성 개선** (style.css)

- **subsection-title 색상**: `var(--text-secondary)` → `var(--primary-color)` (파란색)
- **VIEW 토글 버튼**: 3가지 상태 모두 회색 배경으로 통일
- **input-item label**: `font-size: 0.95rem` → `0.9rem` (loop-reward-item과 동일)
- **sub-tab-btn**: `padding: 8px 12px` → `6px 10px`, `font-size: 0.8rem` → `0.85rem`
- **사용자 설정**: subsection-group 스타일 적용으로 가챠 정보와 통일감 확보

### 주요 변경사항

**파일 변경**:
- `BaseGachaViewModel.js`: applyDependencies 실행 순서 변경, 초기값 즉시 적용
- `Star3GachaViewModel.js`: 중복 applyDependencies 호출 제거
- `Star2GachaViewModel.js`: 중복 applyDependencies 호출 제거
- `GachaConstants.js`: 생일 가챠 DEPENDENCIES 형식 통일
- `index.html`: 섹션 구조 개편, 태그 통일, subsection-group 추가
- `style.css`: subsection-group, subsection-title, 버튼 스타일 개선

---

## v1.8.1 (2026-01-28) - 생일/본가(2탄) 가챠 확장

### 새로운 기능

**1. 생일/본가(2탄) 통합 지원**

**탭 이름 변경**: "생일" → "생일/본가(2탄)"

**프리셋 추가** (GachaConstants.js:72-90):
- **생일**: 픽업 1개, 일반 1.5%, 스탭업 2.0%, Step3 ON
- **본가(2탄)**: 픽업 5개, 일반 0.75%, 스탭업 1.0%, Step3 OFF

**2. Step3 확정 기능 추가**

30회 배수(30, 60, 90...)마다 확정 획득 옵션:
- Step3 토글 버튼 추가
- 프리셋에 따라 자동 설정 (생일: ON, 본가(2탄): OFF)
- 스탭업 횟수 제한 해제 (30회 → 9999회)

**3. 저격 픽업 수 기능 추가**

3성 가챠와 동일하게 목표 개수 지정:
- 기본값: 0 (전체 N개 수집)
- 1~N: 해당 개수만 수집
- pickupCount에 자동 연동 (최대값 제한)

### 버그 수정

**Step3 확정 메시지 오류** (BirthdayGachaViewModel.js:176, GachaResultView.js:143):
- **문제**: 30회일 때만 확정 메시지 표시, 60회/90회는 표시 안 됨
- **해결**: 확정 횟수 계산 로직 수정
  ```javascript
  // 변경 전
  stepGuaranteed: stepPulls === GACHA_RULES.BIRTHDAY.STEPUP_MAX ? 1 : 0

  // 변경 후
  stepGuaranteed: step3Mode === 'included'
      ? Math.floor(stepPulls / GACHA_RULES.BIRTHDAY.STEPUP_GUARANTEE)
      : 0
  ```
- **UI 메시지**: "Step3 확정 N회 획득!" (N = 실제 확정 횟수)

**효율 차트 업데이트 누락** (EfficiencyCalculator.js:230-253):
- **문제**: 저격 픽업 수 변경 시 효율 차트가 업데이트되지 않음
- **해결**: `calculateBirthday()`에 N, M 파라미터 추가, 동적 DP 배열 사용

### 주요 변경사항

**파일 변경**:
- `index.html`: Step3 버튼, 저격 픽업 수 input 추가
- `GachaConstants.js`: BIRTHDAY.PRESETS, STEP3 토글 상태 추가
- `BirthdayGachaModel.js`: targetCount, step3Mode 추가, localStorage 저장
- `BirthdayGachaViewModel.js`: 프리셋, Step3 토글, targetCount 계산 로직
- `EfficiencyCalculator.js`: N, M 기반 동적 계산
- `ToggleButton.js`: `setState()` 메서드 추가

---

## v1.8.0 (2026-01-23) - 확률 표기법 개선

### 버그 수정

**1. 생일 가챠 입력 필드 활성화 및 localStorage 저장** (index.html:169-178, BirthdayGachaModel.js:20-43, BirthdayGachaViewModel.js:15-20):

**문제**:
- 픽업 개수, 일반 픽업 확률, 스탭업 픽업 확률이 `disabled` 상태
- `BirthdayGachaModel.toJSON()`이 빈 객체 반환 → localStorage에 저장 안 됨
- `inputsMap`에 3개 필드가 누락되어 InputBinder와 연결 안 됨

**해결**:
1. index.html에서 `disabled` 제거, `min`/`max`/`step` 속성 추가
2. `toJSON()`/`fromJSON()` 메서드 구현으로 localStorage 저장/로드 지원
3. `inputsMap`에 3개 필드 추가

```javascript
// BirthdayGachaModel.js - 변경 후
toJSON() {
    return {
        pickupCount: this.pickupCount.value,
        normalRate: this.normalRate.value,
        stepRate: this.stepRate.value,
        // ... 옵션들
    };
}

// BirthdayGachaViewModel.js - 변경 후
this.inputsMap = {
    'birthdayPickupCount': this.model.pickupCount,
    'birthdayNormalRate': this.model.normalRate,
    'birthdayStepRate': this.model.stepRate,
    // ...
};
```

**2. probabilityBounded에서 100% 확률이 99.999%↑로 표시되는 버그** (Formatter.js:60-89):

**문제 1**: 조건 순서 오류
- `probability = 1` (정확히 100%)을 입력하면 "99.999%↑"로 표시됨
- 원인: `percent >= 100` 체크가 경계값 체크(`percent > 100 - threshold`) **이후**에 실행됨
- `100 > 99.999` 조건이 먼저 true가 되어 "99.999%↑" 반환

**문제 2**: 부동소수점 오차
- 차트에서 `context.raw / 100` 연산 시 부동소수점 오차 발생
- 예: `100.0 / 100 = 0.9999999999999999` (JavaScript 부동소수점)
- 실제 케이스: 3성 일반 프리셋, 픽업 1개, 2주 보상 천장(셀렉) 설정
  - 80회: "100.000%" 표시 ✓
  - 110회: "99.999%↑" 표시 ✗ (실제로는 100%)

**해결**:
1. `probability === 0` 및 `probability >= 1` 체크를 **percent 계산 전**으로 이동
2. **EPSILON (1e-9) 허용 범위** 도입
   - `probability >= 1 - EPSILON` → 100% 처리 (0.999999999 이상)
   - `probability <= EPSILON` → 0% 처리

```javascript
// 변경 전
const percent = probability * 100;
if (percent >= 100) return "100.000%";        // 도달 불가
if (percent > 100 - threshold) return "99.999%↑";  // 먼저 실행 ✗

// 변경 후
const EPSILON = 1e-9;  // 부동소수점 오차 허용
if (probability >= 1 - EPSILON) return "100.000%";  // 0.999999999 → 100%
if (probability <= EPSILON) return "0.000%";
const percent = probability * 100;
if (percent > 100 - threshold) return "99.999%↑";
```

### UI/UX 개선

**1. 색상 시스템 개편** (style.css:5-78):

**변경 사항**:
- :root 색상 변수를 체계적으로 재구성
- Primary: `#283c86` (기존 파란색 유지)
- Secondary: `#4a66d5` (Primary 기반의 밝은 파란색, 기존 녹색 대체)
- 8단계 Gray Scale 추가 (gray-50 ~ gray-800)
- Semantic Colors 정의 (success, warning, danger, info)

**컴포넌트 색상 적용**:
- Sub-tab active: Primary 색상 (#283c86)
- Preset 버튼: Secondary 기반 (연한 파란색 배경 + hover 시 진한 파란색)
- Toggle 버튼 active: Secondary 색상
- Toggle 버튼 off: 회색 유지

**2. Sub-tab 스타일 개선** (style.css:469-502):

**변경 사항**:
- 둥근 알약 스타일 → 플랫한 탭 스타일
- `flex-wrap: wrap` 추가로 좁은 화면에서 여러 줄 배치 지원
- `font-weight: bold` 적용으로 가독성 향상
- 배경: 회색 바탕 (#f3f5f7)
- 활성 탭: 흰색 배경 + Primary 색상 텍스트 + 그림자

### 새로운 기능

**경계값 명시 표기법 추가**

**문제**:
- 기존: `0.0003%` → `0.000%` 표시 (실제 0이 아닌데 0으로 보임)
- 기존: `99.9997%` → `100.000%` 표시 (실제 100이 아닌데 100으로 보임)
- 사용자가 정확히 0% 또는 100%가 아님을 알 수 없음

**해결**:
- 차트 레이블에 화살표 표기 도입
  - `0.001%↓` = "0.001%보다 작음"
  - `99.999%↑` = "99.999%보다 큼"
- 숫자 뒤에 화살표 배치로 정렬 깔끔하게 유지

### 변경 사항

#### 1. Formatter.js 메서드 추가

**새로운 메서드** (v1.8.0 최종):

1. **`probabilityFraction(probability, decimals = 3)`**
   - 용도: 범례, 툴팁, 요약 (정확한 확률 전달)
   - 특징: 분수 표기 지원 (`1/100,000`)
   - 예시:
     ```
     0.000003 → "1/333,333"
     0.00123  → "0.123%"
     0.5      → "50.000%"
     ```

2. **`probabilityBounded(probability, decimals = 3)`**
   - 용도: 차트 내부 레이블, 모든 확률 표시 (가독성 우선)
   - 특징: 화살표로 경계값 명시
   - 예시:
     ```
     0.000003 → "0.001%↓"  (0.001%보다 작음)
     0.00123  → "0.123%"
     0.999997 → "99.999%↑" (99.999%보다 큼)
     ```

**호환성**:
- 기존 `formatProbability()` 유지 (내부적으로 `probabilityFraction(prob, 3)` 호출)
- 코드베이스 전체에서 새 메서드명 사용 (별칭 제거됨)

#### 2. 차트 및 확률 표시 전면 개선

**파일**:
- [js/utils/ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)
- [js/view/gacha/GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)

**변경 사항**:

1. **차트 레이블** (ChartAdapter.js):
   ```javascript
   // 변경 전
   formatter: (value) => value + '%'

   // 변경 후
   formatter: (value) => Formatter.probabilityBounded(value / 100, 2)
   ```

2. **차트 툴팁 차이값** (ChartAdapter.js:186):
   ```javascript
   // 변경 전
   const diff = (v1 - v2).toFixed(3);

   // 변경 후
   const diff = Math.abs(v1 - v2) / 100;
   const diffText = Formatter.probabilityBounded(diff, 3).replace('%', '');
   ```

3. **CDF 차트 툴팁** (GachaResultView.js:468):
   ```javascript
   // 변경 전
   return ` ${context.dataset.label}: ${context.raw.toFixed(3)}%`;

   // 변경 후
   const probText = Formatter.probabilityBounded(context.raw / 100, 3);
   return ` ${context.dataset.label}: ${probText}`;
   ```

4. **역추적 결과 표시** (GachaResultView.js:547-548):
   ```javascript
   // 변경 전
   실제 ${actualProbStepup.toFixed(2)}%

   // 변경 후
   실제 ${Formatter.probabilityBounded(actualProbStepup / 100, 2)}
   ```

5. **상세 계산 근거 확률** (GachaResultView.js:196, 248-249, 262-263, 274):
   - 모든 `.toFixed()` 호출을 `Formatter.probabilityBounded()` 또는 `probabilityFraction()`으로 대체
   - 3성, 2성, 생일 가챠의 모든 확률 표시 개선

6. **효율 차트 (Efficiency Chart)** (GachaResultView.js:292-293, 346-353 / ChartAdapter.js:180):
   ```javascript
   // 변경 전 (데이터 준비)
   const finalStep = stepupData.map(v => parseFloat(v[modeKey]).toFixed(3));
   const finalNorm = normalData.map(v => parseFloat(v[modeKey]).toFixed(3));

   // 변경 후 (데이터 준비)
   const finalStep = stepupData.map(v => parseFloat(v[modeKey]));
   const finalNorm = normalData.map(v => parseFloat(v[modeKey]));

   // 변경 전 (요약 텍스트)
   (스탭업 ${sVal}% vs 일반 ${nVal}%)

   // 변경 후 (요약 텍스트)
   const sValText = Formatter.probabilityBounded(sVal / 100, 3);
   const nValText = Formatter.probabilityBounded(nVal / 100, 3);
   (스탭업 ${sValText} vs 일반 ${nValText})

   // 변경 전 (라인 차트 툴팁)
   return ` ${label}: ${context.raw}%`;

   // 변경 후 (라인 차트 툴팁)
   const probText = Formatter.probabilityBounded(context.raw / 100, 3);
   return ` ${label}: ${probText}`;
   ```

7. **총 획득 수 차트 (Total Count Chart)** (ResultView.js:117-118, 162):
   ```javascript
   // 변경 전 (THRESHOLD)
   const THRESHOLD = 0.0001;  // 0.01% 미만은 차트에서 제외

   // 변경 후 (THRESHOLD)
   const THRESHOLD = 0.00001;  // 0.001% 이상 모두 포함

   // 변경 전 (데이터)
   data.push((val * 100).toFixed(2));

   // 변경 후 (데이터)
   data.push(val * 100);  // Keep as number for chart rendering
   ```

**효과**:
- 전체 UI에서 일관된 확률 표기
- 경계값 혼란 완전 제거
- 매우 낮은 확률도 명확하게 표시 (`0.001%↓`)
- 효율 차트(efficiencyChart, efficiencyChart2)에서도 경계값 표시 적용
- 총 획득 수 차트(resultChartTotal3, resultChartTotal2)에서 0.001% 이상의 확률 모두 표시

### 기술적 세부사항

**화살표 선택 이유**:
- ✅ 숫자 정렬 완벽 (시작 위치 일정)
- ✅ 시각적 직관성 (↓ = 더 작음, ↑ = 더 큼)
- ✅ 차트 가독성 우수
- ✅ 게임 UI 스타일에 적합

**다른 방식과 비교**:
```
부등호 앞 배치:        화살표 뒤 배치:
< 0.001%              0.001%↓
  1.234%              1.234%
 50.000%             50.000%
> 99.999%            99.999%↑
```

부등호를 앞에 두면 정렬이 흐트러지지만, 화살표를 뒤에 두면 완벽하게 정렬됩니다.

**경계값 판정 로직**:
```javascript
const threshold = 1 / Math.pow(10, decimals);  // decimals=3 → 0.001
if (percent < threshold) return `${threshold.toFixed(decimals)}%↓`;
if (percent > 100 - threshold) return `${(100 - threshold).toFixed(decimals)}%↑`;
```

### 테스트

**테스트 파일**: [test/test-formatter-v1.8.0.html](scsfp/test/test-formatter-v1.8.0.html)

**테스트 커버리지**:
- `probabilityFraction`: decimals 2, 3 테스트
- `probabilityBounded`: decimals 2, 3 테스트
- 경계값 정밀 테스트 (0.0009%, 0.0010%, 99.999%, 99.9991% 등)
- 하위 호환성 테스트 (기존 `formatProbability` 동작 확인)
- 실제 사용 케이스 (3성, 2성, 생일 가챠)
- **총 44개 테스트 케이스** (별칭 테스트 2개 제거)

### 영향 파일

**코어 파일**:
- [js/utils/Formatter.js](scsfp/js/utils/Formatter.js) - 핵심 메서드 추가 (`probabilityFraction`, `probabilityBounded`)
- [js/utils/ChartAdapter.js](scsfp/js/utils/ChartAdapter.js) - 모든 차트 레이블 및 툴팁 적용
- [js/view/ResultView.js](scsfp/js/view/ResultView.js) - 총 획득 수 차트 THRESHOLD 조정 및 데이터 포맷 개선
- [js/view/gacha/GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js) - 모든 확률 표시 개선

**문서 및 테스트**:
- [test/test-formatter-v1.8.0.html](scsfp/test/test-formatter-v1.8.0.html) - 포괄적 테스트 스위트 (46개 케이스)
- [update/v1.8.0-implementation-summary.md](scsfp/update/v1.8.0-implementation-summary.md) - 상세 구현 문서
- [update/v1.8.0-bugfix-efficiency-chart.md](scsfp/update/v1.8.0-bugfix-efficiency-chart.md) - 효율 차트 버그 수정
- [update/v1.8.0-bugfix-total-chart.md](scsfp/update/v1.8.0-bugfix-total-chart.md) - 총 획득 수 차트 버그 수정

### 향후 확장 계획 (v1.9.0)

- 사용자 설정에서 표기 스타일 선택 가능 (화살표 / 부등호)
- 설정 UI 추가

---

## v1.7.5 (2026-01-23) - Dead Code 제거

### 변경 사항

**미사용 버튼 제거**

**제거 항목**: `star3-efficiency-mode-toggle` 버튼

**배경**:
- v1.7.2 HTML 리팩토링 시 ID 네이밍 통일화 과정에서 포함되었으나 실제로는 미구현/미사용 기능
- 3성 가챠의 "효율 비교"는 이미 "일반 vs 스탭업" 탭에서 제공 중
- JavaScript 바인딩 없음, 항상 `display:none` 상태

**효과**:
- HTML 코드 정리 (불필요한 요소 1개 제거)
- GachaTypeConfig의 buttonVisibility 규칙 간소화
- 혼란 방지 (실제 동작하지 않는 UI 요소 제거)

**영향 파일**:
- [index.html](scsfp/index.html) - 버튼 요소 제거
- [js/view/gacha/GachaTypeConfig.js](scsfp/js/view/gacha/GachaTypeConfig.js) - visibility 규칙에서 제거

**비교**:
- 2성 가챠의 `star2-group-efficiency-mode`는 실제로 사용 중 (그룹별 효율 비교)
- 3성 가챠는 이미 효율 탭에서 일반/스탭업 비교를 제공하므로 별도 모드 불필요

---

## 2026-01-21: HTML/CSS 리팩토링 완료

### ID 네이밍 통일화
**문제**: 3성(`resetBtn3`), 생일(`resetBtnBirthday`), 2성(`resetBtn2`) 간 네이밍 규칙 불일치

**해결**: 모든 ID를 `{type}-{element}` 패턴으로 통일

| 요소 | 이전 (3성 / 생일 / 2성) | 현재 |
|------|----------------------|------|
| 리셋 버튼 | `resetBtn3` / `resetBtnBirthday` / `resetBtn2` | `star3-reset-btn` / `birthday-reset-btn` / `star2-reset-btn` |
| 천장 토글 | `toggleCeilingBtn3` / `toggleCeilingBtnBirthday` / `toggleCeilingBtn2` | `star3-toggle-ceiling` / `birthday-toggle-ceiling` / `star2-toggle-ceiling` |
| 뷰 토글 | `toggleViewBtn3` / `toggleViewBtnBirthday` / `toggleViewBtn2` | `star3-toggle-view` / `birthday-toggle-view` / `star2-toggle-view` |
| 효율 토글 | `btnEfficiencyToggle3` / `btnEfficiencyToggleBirthday` / `btnEfficiencyToggle2` | `star3-efficiency-toggle` / `birthday-efficiency-toggle` / `star2-efficiency-toggle` |
| 프리셋 컨테이너 | `star3PresetContainer` | `star3-preset-container` |
| 2성 그룹 뷰 모드 | `btnGroupViewMode` | `star2-group-view-mode` |
| 2성 그룹 효율 모드 | `btnGroupEfficiencyMode` | `star2-group-efficiency-mode` |

**영향 파일**:
- [index.html](scsfp/index.html)
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js)
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

### Div Depth 축소 (11단계 → 8단계)
**문제**: 과도한 중첩 구조 (`container` → ... → `canvas` 11단계)

**해결**:
- 시멘틱 HTML 태그 적용 (`<header>`, `<main>`, `<section>`, `<aside>`, `<footer>`)
- 서브탭에서 불필요한 `tab-content-wrapper` 제거
- `result-area` 래퍼 제거

**이전 구조** (11단계):
```
container (1) → main-tab-system (2) → tab-content-wrapper (3) → tab-3star (4)
→ sub-tab-container (5) → tab-content-wrapper (6) → res-3s-collection (7)
→ result-area (8) → chart-row (9) → chart-container (10) → canvas (11)
```

**최종 구조** (8단계):
```
container (1) → main (2) → section[tab-3star] (3)
→ sub-tab-container (4) → div[res-3s-collection] (5)
→ chart-row (6) → chart-container (7) → canvas (8)
```

**영향 파일**:
- [index.html](scsfp/index.html)
- [TabManager.js](scsfp/js/view/component/TabManager.js) - `tab-content-wrapper` 없이도 동작하도록 개선

### 인라인 스타일 정리
**해결**: 반복되는 인라인 스타일을 CSS 클래스로 추출

추가된 CSS 클래스:
- `.chart-full`: `width: 100%; flex: none;` - 전체 너비 차트용
- `.input-hint`: 입력 힌트 텍스트 스타일
- `.input-row-half`: 반너비 입력 행
- `.cdf-input-area`: CDF 입력 영역 스타일

**예외**: JavaScript로 동적 제어하는 `style="display:none;"` 유지 (의도된 설계)

**영향 파일**:
- [index.html](scsfp/index.html)
- [style.css](scsfp/css/style.css)

### CSS 개선
**개선 사항**:
- **중복 규칙 제거**: `.view-toggle-btn[data-state="worst"]` 2회 선언 통합
- **!important 제거**: specificity 개선으로 4곳 모두 제거
- **미사용 클래스 제거**: `.cdf-input-section` 제거
- **색상 변수화**: `:root`에 `--surface-light`, `--surface-medium`, `--surface-blue` 변수 추가
- **11개 섹션으로 구조화**: 주석으로 명확히 구분
  1. Base Layout
  2. Tab System
  3. Inputs
  4. Collapsible Sections
  5. Reset & Preset Controls
  6. Loop Rewards UI
  7. Result Options Header
  8. Sub Tab Navigation
  9. Charts & Results
  10. Shared Summary
  11. Responsive Design

**영향 파일**:
- [style.css](scsfp/css/style.css)

### 시멘틱 HTML 적용
**구조**:
- `<header>`: 타이틀 영역 (h1 포함)
- `<main>`: 메인 탭 시스템 전체
- `<section>`: 각 가챠 타입 탭
  - `#tab-3star` (3성 가챠)
  - `#tab-birthday` (생일 가챠)
  - `#tab-2star` (2성 가챠)
- `<aside>`: 공유 결과 요약 영역 (`#shared-result-area`)
- `<footer>`: 향후 저작권, 링크 등 추가 예정 (현재 더미)

**미사용 태그**:
- `<nav>`: 향후 다른 게임 기능 추가 시 사용 예정 (예: 다른 게임 모드, 설정 페이지 등)

**영향 파일**:
- [index.html](scsfp/index.html)

---

## 2026-01-20: 코드 품질 개선

### Phase 1: 안정성 강화

#### 마법 숫자 상수화
**문제**: 하드코딩된 가챠 규칙 숫자 (40, 200, 50, 10 등)가 코드 전반에 산재

**해결**: [GachaConstants.js](scsfp/js/core/GachaConstants.js)에 `GACHA_RULES` 객체 추가

```javascript
export const GACHA_RULES = {
    STAR3: {
        STEPUP_CYCLE: 40,           // 40회마다 Step4 확률 부스트
        CEILING_INTERVAL: 200       // 200회마다 천장 티켓
    },
    STAR2: {
        HIGH_RATE_INTERVAL: 10,     // 일반 가챠 10회마다 95% 보정
        STEPUP_GUARANTEE_FIRST: 5,  // 첫 확정 5회
        STEPUP_GUARANTEE_INTERVAL: 10, // 이후 10회마다
        NORMAL_CEILING_INTERVAL: 100,
        STEPUP_CEILING_INTERVAL: 50
    },
    BIRTHDAY: {
        STEPUP_MAX: 30,
        STEPUP_GUARANTEE: 30,       // 30회째 100% 확정
        CEILING_INTERVAL: 200
    }
};
```

**영향 파일**:
- [GachaConstants.js](scsfp/js/core/GachaConstants.js) - 상수 정의
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js) - `GACHA_RULES.STAR3` 사용
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js) - `GACHA_RULES.STAR2` 사용
- [BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js) - `GACHA_RULES.BIRTHDAY` 사용
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js) - 2성 보정 계산에 사용

#### DOM 조작 제거
**문제**: ViewModel에서 DOM 요소를 직접 조작 (`document.getElementById('targetCount')`)

**해결**: InputBinder의 `maxObserver` 옵션 사용으로 대체

**이전 코드** (Star3GachaViewModel.js):
```javascript
setupDataDependencies() {
    this.model.pickupCount.subscribe((N) => {
        const targetInput = document.getElementById('targetCount');  // ❌ DOM 직접 접근
        if (targetInput) targetInput.max = N;
    });
}
```

**개선 코드**:
```javascript
bindInputs() {
    super.bindInputs();
    this.inputBinder.bind('targetCount', this.model.targetCount, {
        maxObserver: this.model.pickupCount  // ✅ InputBinder가 처리
    });
}
```

**영향 파일**:
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [InputBinder.js](scsfp/js/view/component/InputBinder.js) - `maxObserver` 기능 활용

#### Chart.js import 명시화
**문제**: CDN으로 로드하는 Chart.js의 사용 방식이 명확하지 않음

**해결**: 주석 추가 및 문서화

[index.html](scsfp/index.html):
```html
<!-- Chart.js Libraries -->
<!-- CDN으로 로드하여 전역 변수로 사용 (import 문 불필요) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0"></script>
```

[main.js](scsfp/js/main.js):
```javascript
// Chart.js 전역 변수 등록 (CDN 로드)
Chart.register(ChartDataLabels);
```

**영향 파일**:
- [index.html](scsfp/index.html) - 주석 추가
- [main.js](scsfp/js/main.js) - 주석 추가

### Phase 2: 성능 최적화

#### Chart.js 재렌더링 최적화
**문제**: 차트 업데이트 시 `destroy()` 후 재생성하여 성능 저하 및 깜빡임 발생

**이전 코드** (ChartAdapter.js):
```javascript
static renderChart(ctx, config, chartRef) {
    if (chartRef.current) {
        chartRef.current.destroy();  // ❌ 매번 파괴 후 재생성
    }
    chartRef.current = new Chart(ctx, config);
}
```

**개선 코드**:
```javascript
static renderChart(ctx, config, chartRef) {
    if (chartRef.current) {
        chartRef.current.data = config.data;
        chartRef.current.options = config.options;
        chartRef.current.update('none');  // ✅ 기존 차트 재활용, 애니메이션 없이 즉시 업데이트
    } else {
        chartRef.current = new Chart(ctx, config);
    }
}
```

**효과**:
- 차트 업데이트 성능 향상
- 깜빡임 제거
- 메모리 사용량 감소

**영향 파일**:
- [ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)

### Phase 3: 확장성 개선

#### EfficiencyCalculator 서비스 클래스 분리
**문제**: 3개 ViewModel에서 효율 계산 로직 중복 (~135줄)

**해결**: [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) 신규 생성

**제공 메서드**:
```javascript
// 3성 가챠 효율 계산
static calculate3Star({ M, p_indiv, p_step4, loopRewards, ... })

// 3성 가챠 CDF 역추적
static calculate3StarCDF({ M, p_indiv, p_step4, targetProb, ... })

// 2성 가챠 효율 계산
static calculate2Star({ groupConfigs, ceilingMode, ... })

// 생일 가챠 효율 계산
static calculateBirthday({ normalRate, stepRate, ceilingMode })
```

**효과**:
- 3개 ViewModel에서 `_calculateEfficiencyData()` 메서드 제거
- Star3GachaViewModel의 `_calculateCDFData()` 메서드 제거
- 총 ~135줄 중복 코드 제거
- 효율 계산 로직 중앙화로 유지보수성 향상

**영향 파일**:
- [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) - 신규 생성
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js) - 효율/CDF 계산 위임
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js) - 효율 계산 위임
- [BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js) - 효율 계산 위임

#### ProbabilityEngine 그룹 계산 중앙화
**문제**: Star2GachaViewModel에서 그룹별 스탭업 계산 로직(`_calcGroup`)이 ViewModel에 존재

**해결**: [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)에 `calcStepupGroup()` 메서드 추가

**이전 코드** (Star2GachaViewModel.js):
```javascript
_calcGroup(countStep, pullsStep, ceilingMode) {
    // ... 40줄 이상의 복잡한 스탭업 계산 로직
}
```

**개선 코드** (ProbabilityEngine.js):
```javascript
static calcStepupGroup(N, pulls, p_each, ceilingMode) {
    // 2성 그룹별 스탭업 가챠 계산 (확정 5회, 15회, 25회...)
    // 천장: 50회마다
    // ...
}
```

**효과**:
- ViewModel에서 40줄 이상의 계산 로직 제거
- ProbabilityEngine으로 확률 계산 로직 중앙화
- 2성 그룹 계산 로직 재사용 가능

**영향 파일**:
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js) - `calcStepupGroup()` 추가
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js) - `_calcGroup()` 제거, `calcStepupGroup()` 사용

---

## 2026-01-19: 기능 추가

### CDF 역추적 기능
**기능**: 목표 확률 달성에 필요한 가챠 횟수 계산

**구현 위치**: 3성 가챠 - 역추적 서브탭 (`res-3s-cdf`)

**UI**:
- 목표 확률 입력 필드 (`targetProbability3`)
- CDF 차트: 누적 확률 곡선 + 목표 달성 지점 표시
- 결과 요약: 필요한 일반/스탭업 가챠 횟수

**계산 로직**:
```javascript
EfficiencyCalculator.calculate3StarCDF({
    M, p_indiv, p_step4, targetProb, randomMode, step4Mode, loopRewards, ...
})
```

**영향 파일**:
- [index.html](scsfp/index.html) - CDF 서브탭 추가
- [Star3GachaModel.js](scsfp/js/model/gacha/Star3GachaModel.js) - `targetProbability` Observable 추가
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js) - CDF 탭 처리 로직
- [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) - `calculate3StarCDF()` 메서드
- [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js) - `renderCDFChart()` 메서드

---

## v1.7.3 (2026-01-22) - 아키텍처 리팩토링

### 개요
코드베이스 전반에 걸친 대규모 리팩토링으로 유지보수성, 확장성, 안정성을 대폭 향상시켰습니다. 5개의 우선순위 리팩토링 항목을 모두 완료했으며, 기능적 변화는 없고 내부 구조만 개선되었습니다.

### 주요 변경사항

#### 1. View/ViewModel 강결합 해소 (High Priority)

**문제**: 가챠 타입별로 별도 렌더 메서드가 존재하고 element ID가 하드코딩됨

**해결**:
```javascript
// 신규 파일: js/view/gacha/GachaTypeConfig.js
export const GACHA_TYPE_CONFIG = {
    star3: {
        mainTabId: 'tab-3star',
        charts: { collection: { canvas: 'resultChart', legend: 'legendList' } },
        subTabs: { collection: 'res-3s-collection', ... },
        hasRandomMode: true,
        hasCdfTab: true,
        buttonVisibility: { efficiency: ['star3-efficiency-toggle'], ... }
    },
    // birthday, star2 설정...
};

// GachaResultView.js - 통합 렌더링
static render(gachaType, result, context, model, charts) {
    const config = getGachaConfig(gachaType);
    // 설정 기반 렌더링...
}
```

**효과**:
- 새 가챠 타입 추가 시 설정 파일만 수정
- 렌더링 로직 중복 제거
- Element ID 하드코딩 제거

**영향 파일**:
- `js/view/gacha/GachaTypeConfig.js` (NEW)
- [js/view/gacha/GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)

---

#### 2. Observable 메모리 누수 방지 (High Priority)

**문제**: Observable 구독이 해제되지 않아 장기 사용 시 메모리 누수 가능성

**해결**:
```javascript
// Observable.js - unsubscribe 함수 반환
subscribe(listener) {
    this._listeners.push(listener);
    return () => {
        this._listeners = this._listeners.filter(l => l !== listener);
    };
}

// BaseGachaViewModel.js - 구독 관리
constructor() {
    this._subscriptions = [];
}

init() {
    const unsubscribe = observable.subscribe(...);
    this._subscriptions.push(unsubscribe);
}

destroy() {
    this._subscriptions.forEach(unsub => unsub());
    this._subscriptions = [];
}
```

**효과**:
- SPA 전환 시 메모리 누수 방지
- 명시적인 리소스 정리 패턴

**영향 파일**:
- [js/core/Observable.js](scsfp/js/core/Observable.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
- [js/view/component/InputBinder.js](scsfp/js/view/component/InputBinder.js)

---

#### 3. Input 바인딩 설정 불일치 해소 (High Priority)

**문제**: 입력 필드 타입(int/float)을 런타임에 추론하여 예측하기 어려움

**해결**:
```javascript
// GachaConstants.js - 명시적 타입 선언
STAR3: {
    INPUTS: [
        { id: 'pickupCount', min: 1, max: 100, def: 2, type: 'int' },
        { id: 'pickupRate', min: 0, max: 100, def: 1, type: 'float' },
        // ...
    ]
}

// BaseGachaViewModel.js - 타입 추론 제거
bindInputs() {
    const setting = configMap.get(id) || {};
    let binderOptions = {
        type: setting.type || 'float',  // 명시적 타입 사용
        // ...
    };
}
```

**효과**:
- 타입 정보가 설정에 집중
- 런타임 추론 로직 제거로 예측 가능성 향상

**영향 파일**:
- [js/core/GachaConstants.js](scsfp/js/core/GachaConstants.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)

---

#### 4. Tab 관리 패턴 중복 제거 (Medium Priority)

**문제**: 3개 ViewModel에서 `onTabChange()` 로직이 거의 동일 (각 ~15줄)

**해결**:
```javascript
// GachaTypeConfig.js - 버튼 visibility 설정
buttonVisibility: {
    efficiency: ['star3-efficiency-toggle', 'star3-efficiency-mode-toggle'],
    collection: ['star3-toggle-view'],
    cdf: []  // CDF 탭에서는 버튼 숨김
}

// applyTabVisibility() 함수로 자동 관리
export function applyTabVisibility(config, activeSubTab) {
    // 설정 기반으로 버튼 visibility 자동 처리
}

// ViewModel - 단순화됨
onTabChange(tabId) {
    this.calculate();
    const config = getGachaConfig('star3');
    applyTabVisibility(config, tabId);
}
```

**효과**:
- 3개 ViewModel에서 중복 코드 제거 (각 15줄 → 4줄)
- 탭별 버튼 표시 규칙이 설정으로 관리

**영향 파일**:
- [js/view/gacha/GachaTypeConfig.js](scsfp/js/view/gacha/GachaTypeConfig.js)
- [js/viewmodel/gacha/Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [js/viewmodel/gacha/BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js)
- [js/viewmodel/gacha/Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

---

#### 5. Observable 의존성 패턴 표준화 (Medium Priority)

**문제**: 데이터 의존성 로직이 각 ViewModel의 `setupDataDependencies()`에 산재

**해결**:
```javascript
// GachaConstants.js - 선언적 의존성 정의
STAR3: {
    DEPENDENCIES: [
        {
            source: 'maxLoops',
            handler: (value, model, viewModel) => {
                model.stepMax.value = value * 40;
                if (viewModel && viewModel.updateLoopUI) {
                    viewModel.updateLoopUI();
                }
            }
        },
        {
            source: 'pickupCount',
            handler: (value, model) => {
                if (model.targetCount.value > value) {
                    model.targetCount.value = value;
                }
            }
        }
    ]
}

// BaseGachaViewModel.js - 자동 적용
applyDependencies() {
    if (!this.config || !this.config.DEPENDENCIES) return;

    this.config.DEPENDENCIES.forEach(dep => {
        const unsubscribe = this.model[dep.source].subscribe((value) => {
            if (!this.isInitializing) {
                dep.handler(value, this.model, this);
            }
        });
        this._subscriptions.push(unsubscribe);
    });
}

// ViewModel - setupDataDependencies() 제거
init() {
    this.applyDependencies();  // 자동 적용
    super.init();
}
```

**효과**:
- 의존성 로직이 설정 파일에 집중
- 각 ViewModel의 `setupDataDependencies()` 제거
- 새 의존성 추가 시 코드 수정 불필요

**영향 파일**:
- [js/core/GachaConstants.js](scsfp/js/core/GachaConstants.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
- [js/viewmodel/gacha/Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [js/viewmodel/gacha/Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

---

### 리팩토링 통계

- **해결된 항목**: 5개 (High: 3, Medium: 2)
- **제거된 중복 코드**: 약 80줄
- **신규 파일**: 1개 (GachaTypeConfig.js)
- **개선된 파일**: 8개
- **개선된 패턴**:
  - Observable 구독 생명주기 관리
  - 설정 중앙화 (UI 설정, 의존성 정의)
  - 선언적 프로그래밍 (버튼 visibility, 의존성)

### 하위 호환성

모든 변경사항은 내부 구조 개선이며, 기존 API와 기능은 완전히 유지됩니다:
- `GachaResultView.render3Star()` 등 기존 메서드는 래퍼로 유지
- 사용자 대면 기능 및 UI는 변화 없음
- LocalStorage 키 및 데이터 구조 호환

### 추가 문서

이번 리팩토링의 상세 내역은 [REFACTORING.md](REFACTORING.md)를 참조하세요.

---

## v1.7.4 (2026-01-22) - 저장 동작 개선

### 변경 사항

**가챠 횟수 저장 제외**

**문제**: 2성 가챠의 스탭업 횟수(`pullsStepA`, `pullsStepB`, `pullsStepC`, `pullsStepD`)가 LocalStorage에 저장되어 페이지 새로고침 시에도 유지됨

**해결**: 가챠 횟수는 세션마다 초기화되도록 저장 대상에서 제외
```javascript
// Star2GachaModel.js - toJSON()
toJSON() {
    return {
        countNormal: this.countNormal.value,
        rateTotal: this.rateTotal.value,
        // 그룹별 픽업 수와 목표만 저장
        countStepA: this.countStepA.value,
        targetCountA: this.targetCountA.value,
        // pullsStepA 제외 (항상 0으로 시작)
        // ...
    };
}
```

**효과**:
- 사용자가 새로고침 시 가챠 횟수가 0으로 초기화됨
- 픽업 설정(countStep*, targetCount*)은 여전히 저장되어 편의성 유지
- 3성, 생일 가챠는 이미 횟수를 저장하지 않았으므로 변경 없음

**영향 파일**:
- [js/model/gacha/Star2GachaModel.js](scsfp/js/model/gacha/Star2GachaModel.js)

---

## 버전 히스토리

- **v1.7.4** (2026-01-22): 2성 가챠 횟수 저장 제외 - 세션마다 초기화
- **v1.7.3** (2026-01-22): 아키텍처 리팩토링 - 설정 중앙화, 메모리 관리, 패턴 표준화
- **v1.7.2** (2026-01-21): HTML/CSS 리팩토링, ID 네이밍 통일화, 시멘틱 HTML, 게임 시스템 문서화
- **v1.7.1** (2026-01-20): 코드 품질 개선, 서비스 클래스 분리, 성능 최적화
- **v1.7.0** (2026-01-19): CDF 역추적 기능 추가
- **v1.6.x** 이전: 기존 기능 구현 (3성/2성/생일 가챠 시뮬레이터)
