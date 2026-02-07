# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 다룰 때 참고하는 가이드입니다.

## 프로젝트 개요

**샤니송 유틸리티** - THE IDOLM@STER Shiny Colors Song for Prism을 위한 종합 도구 모음. 가챠 확률 계산기와 과금 효율 분석 기능을 제공합니다.

- **가챠 확률 계산기**: 동적 계획법(DP)과 쿠폰 컬렉터 알고리즘을 활용하여 3성/2성/생일/콜라보 가챠 시스템의 수집 확률을 시뮬레이션
- **과금 효율 분석**: 플랫폼별(아소비/Android/iOS) 패키지 비교 및 효율 계산 (Phase 2 예정)
- **SPA 아키텍처**: 사이드바 네비게이션을 통한 섹션 전환(가챠 ↔ 과금) 및 히스토리 관리 지원

**버전**: [UPDATE.md](UPDATE.md) 참조
**언어**: Vanilla JavaScript (ES6 modules)
**기술 스택**: HTML5, CSS3, Chart.js 4.4.1

## 게임 시스템 이해

### 카드 종류
- **프로듀스 카드 (P카드)**: 1성 ~ 3성 등급
- **서포트 카드 (S카드)**: U → UR → SSR 등급
- **리뉴얼 이후**: 가챠에서 P카드와 S카드가 동시 배출
  - 3성 가챠: 픽업 획득 시 P카드(3성) + S카드(SSR) 동시 획득
  - 2성/생일 가챠: S카드 없음 (P카드만 배출)

### 재화 종류
- **무료돌 (프리즘 쥬얼)**: 일반 가챠에만 사용 가능
- **유료돌 (프리즘 쥬얼)**: 일반 가챠 + 스탭업 가챠 모두 사용 가능

### 유료돌 플랫폼 격리 시스템

게임은 4개 플랫폼에서 실행 가능하며, **유료돌은 플랫폼별로 완전 격리**됩니다.

#### 플랫폼 종류
1. **DMM판** (PC): Windows/Mac 브라우저 기반
2. **Android판**: Google Play 스토어
3. **iOS판**: Apple App Store
4. **아소비 스토어**: 구매 전용 웹사이트 (플랫폼 아님)

#### 유료돌 격리 규칙

**무료돌 (이벤트 보상 등)**:
- ✅ 모든 플랫폼에서 공유
- 어느 플랫폼에서든 획득하면 모든 플랫폼에서 사용 가능

**유료돌 (과금)**:
- ❌ 플랫폼별로 완전 격리
- 다른 플랫폼에서 구매한 유료돌은 **존재하지 않는 것처럼 보임**

#### 플랫폼별 유료돌 사용 규칙

```
DMM판
├─ 구매: DMM에서만
├─ 사용: DMM 구매분만
└─ 타 플랫폼 돌: 보이지 않음

Android판
├─ 구매: Android 스토어 또는 아소비 스토어
├─ 사용: Android + 아소비 구매분 (합산)
└─ 타 플랫폼 돌: 보이지 않음

iOS판
├─ 구매: iOS 스토어 또는 아소비 스토어
├─ 사용: iOS + 아소비 구매분 (합산)
└─ 타 플랫폼 돌: 보이지 않음

아소비 스토어
├─ 성격: 구매 전용 웹사이트 (플랫폼 아님)
├─ 목적: 구글/애플 수수료(~30%) 회피
├─ 구매 방법: 공식 웹사이트에서 직접 결제
└─ 구매한 돌: Android + iOS 양쪽에서 사용 가능
```

#### 격리 시스템 예시

**시나리오**: 유저가 계정 하나로 여러 플랫폼 사용
```
1. DMM에서 유료돌 1000개 구매
2. Android로 전환
   → DMM 유료돌 1000개는 보이지 않음
   → Android/아소비 구매분만 보임

3. 아소비 스토어에서 500개 구매
4. Android로 접속
   → Android 구매분 + 아소비 500개 = 합산 표시
5. iOS로 접속
   → iOS 구매분 + 아소비 500개 = 합산 표시
6. DMM으로 접속
   → DMM 유료돌 1000개만 표시 (아소비 500개 안 보임)
```

#### 플랫폼 간 유료돌 흐름도

```
         무료돌 (공유)
         ↕   ↕   ↕   ↕
       ┌────┬────┬────┬────┐
       │DMM │And.│iOS │Asobi│ ← 구매 지점
       └────┴────┴────┴────┘
         ↓    ↓    ↓    ↓
       ┌────┬────┬────┬────┐
       │DMM │And.│iOS │공유 │ ← 사용 가능 플랫폼
       │전용│전용│전용│And+│
       │    │+공유│+공유│iOS │
       └────┴────┴────┴────┘
```

**중요**:
- 하나의 계정으로 모든 플랫폼 접속 가능
- 무료돌은 완전 공유
- 유료돌은 플랫폼별 지갑(wallet)처럼 분리
- 아소비 스토어만 예외적으로 Android+iOS 공유

### 유료돌 패키지 정보

#### 부가 재화 설명

**무돌 (虹の結晶, Rainbow Crystal)**:
- 용도: 카드 등급 업그레이드 (범용)
- 대상: P카드 + S카드 모두 사용 가능
- 특징: 카드별 "날개/피스"와 달리 모든 카드에 범용으로 사용 가능한 재화

**날개 (P카드 전용 재화)**:
- 대상: P카드 (프로듀스 카드, 3성)
- 용도: P카드 등급 업그레이드 (카드별 전용)
- 획득: 최초 획득 시 + 중복 획득 시 지급
- 사용: 해당 P카드에만 사용 가능

**피스 (S카드 전용 재화)**:
- 대상: S카드 (서포트 카드, SSR)
- 용도: S카드 등급 업그레이드 (카드별 전용)
- 획득: 최초 획득 시 + 중복 획득 시 지급
- 사용: 해당 S카드에만 사용 가능

**OurSTREAM**:
- 용도: 캐릭터 스트리밍 방송 컨텐츠 영구 해금
- 성격: 수집형 컨텐츠 (스토리/보이스 감상)
- 소비: 방송 1개당 OurSTREAM 1개 사용
- 특징: 한번 해금하면 영구적으로 다시보기 가능
- 획득: Android/iOS 월 주기 패키지에서 1개 제공
- 가치: 프리즘 쥬얼로 환산 불가 (순수 감상용, 게임 플레이 영향 없음)

#### 플랫폼별 패키지 상세

**표기 규칙**:
- 돌: 프리즘 쥬얼 개수
- 가격: 엔화(¥) 또는 원화(₩)
- 무돌: 虹の結晶 개수

---

**1. 아소비 스토어 (ASOBI STORE)**

**한정 패키지** (기간/횟수 제한):
```
PJ 가챠 증량 (XXXリリース記念 1回限定！)
├─ 돌: 10,000개
├─ 가격: ¥10,000
├─ 제한: 해당 PJ 가챠 개최 시 1회 한정
└─ 비고: PJ(プロジェクト) 가챠 출시 기념 패키지

주년/반주년 증량
├─ (추후 추가 예정)
└─ 비고: 아소비 vs Android/iOS 구매 한도 차이 있음
```

**월 주기 패키지** (매월 1회):
```
월 증량 (月一限定プリズムジュエル プラチナ)
├─ 돌: 10,000개
├─ 가격: ¥10,000
├─ 보너스: 무돌 50개
└─ 제한: 월 1회
```

**상시 패키지**:
```
A팩 (プリズムジュエルA)
├─ 돌: 85개
└─ 가격: ¥160

B팩 (プリズムジュエルB)
├─ 돌: 380개
└─ 가격: ¥480

C팩 (プリズムジュエルC)
├─ 돌: 820개
└─ 가격: ¥1,000

D팩 (プリズムジュエルD)
├─ 돌: 2,700개
├─ 가격: ¥3,200
└─ 보너스: 무돌 15개

E팩 (プリズムジュエルE)
├─ 돌: 4,410개
├─ 가격: ¥5,000
└─ 보너스: 무돌 25개

F팩 (プリズムジュエルF)
├─ 돌: 8,875개
├─ 가격: ¥10,000
└─ 보너스: 무돌 50개
```

---

**2. Android (Google Play)**

**한정 패키지**:
```
주년/반주년 증량
└─ (추후 추가 예정)

※ 월 증량 패키지 없음
```

**월 주기 패키지** (매월 1회):
```
B팩 (プリズムジュエルB) - 월 주기
├─ 돌: 360개
├─ 가격: ¥480
├─ 보너스: OurSTREAM 1개
└─ 제한: 월 1회, iOS와 배타적 (둘 중 한 곳만 구매 가능)
```

**상시 패키지**:
```
A팩 (プリズムジュエルA)
├─ 돌: 80개
└─ 가격: ¥160

B팩 (プリズムジュエルB)
├─ 돌: 360개
└─ 가격: ¥480

C팩 (プリズムジュエルC)
├─ 돌: 780개
└─ 가격: ¥1,000

D팩 (プリズムジュエルD)
├─ 돌: 2,570개
└─ 가격: ¥3,200

E팩 (プリズムジュエルE)
├─ 돌: 4,200개
└─ 가격: ¥5,000

F팩 (プリズムジュエルF)
├─ 돌: 8,450개
└─ 가격: ¥10,000
```

---

**3. iOS (Apple App Store)**

**한정 패키지**:
```
주년/반주년 증량
└─ (추후 추가 예정)

※ 월 증량 패키지 없음
```

**월 주기 패키지** (매월 1회):
```
B팩 (プリズムジュエルB) - 월 주기
├─ 돌: 360개
├─ 가격: ₩4,400
├─ 보너스: OurSTREAM 1개
└─ 제한: 월 1회, Android와 배타적 (둘 중 한 곳만 구매 가능)
```

**상시 패키지**:
```
A팩 (プリズムジュエルA)
├─ 돌: 80개
└─ 가격: ₩1,100

B팩 (プリズムジュエルB)
├─ 돌: 360개
└─ 가격: ₩4,400

C팩 (プリズムジュエルC)
├─ 돌: 780개
└─ 가격: ₩8,800

D팩 (プリズムジュエルD)
├─ 돌: 2,570개
└─ 가격: ₩29,000

E팩 (プリズムジュエルE)
├─ 돌: 4,200개
└─ 가격: ₩44,000

F팩 (プリズムジュエルF)
├─ 돌: 8,450개
└─ 가격: ₩88,000
```

---

**4. DMM판**

**패키지 정보**:
```
※ 현재 데이터 없음 (추후 추가 예정)
```

---

#### 플랫폼 간 패키지 비교

**아소비 vs Android/iOS 차이점**:

1. **돌 개수 차이** (상시 A~F팩):
   - 아소비가 더 많은 돌 제공
   - 예: B팩 → 아소비 380개 vs Android/iOS 360개

2. **무돌 보너스**:
   - 아소비: D/E/F팩에서 무돌 제공
   - Android/iOS: 무돌 보너스 없음

3. **월 주기 패키지**:
   - 아소비: 10,000돌 + 무돌 50개 (¥10,000)
   - Android/iOS: 360돌 + OurSTREAM 1개 (¥480/₩4,400)
   - Android/iOS 월 주기는 **배타적** (한 곳에서 사면 다른 곳 불가)

4. **한정 패키지**:
   - 아소비: PJ 가챠 증량 (10,000돌)
   - Android/iOS: PJ 가챠 증량 없음

**가격 비교** (환율 고려 필요):
- Android: 엔화(¥) 표기
- iOS: 원화(₩) 표기
- 아소비: 엔화(¥) 표기

**효율 분석 포인트**:
- 돌/엔 비율 (1엔당 돌 개수)
- 무돌 가치 환산
- OurSTREAM 가치 환산
- 플랫폼 수수료 차이 (구글/애플 ~30% vs 아소비 0%)

### 가챠 공통 개념
- **픽업**: 해당 가챠의 특정 목표 카드들
  - 3성 가챠: 최고 등급(3성)이 나와도 픽업이 아닐 수 있음 (픽뚫 발생)
  - 2성 가챠: 2성이 나오면 100% 픽업 (픽뚫 없음)
  - 생일 가챠: 픽업 1개 고정
- **천장 (셀렉 티켓)**: 일정 횟수 도달 시 원하는 픽업 카드 선택 가능
- **랜덤 티켓 (픽업 티켓)**: 픽업 중 랜덤으로 1개 획득 (천장의 너프 버전)
- **주(周)**: 스탭업 가챠의 특정 단위 (3성: Step1~4 = 40회)

### 3성 가챠 시스템

#### 일반 가챠
- 확률 조정 없는 기본 가챠
- 픽업 확률: 사용자 설정 (일반적으로 1.0% 내외)

#### 스탭업 가챠 (유료돌 전용)
- **Step 구조**: Step1 ~ Step4, 각 Step은 10회
  - Step1: 기본 확률
  - Step2: 10회째에 3성+SSR 확률 2배 (픽업 확률은 불변)
  - Step3: 1~10회 전부 3성+SSR 확률 2배 (픽업 확률은 불변)
  - Step4: 10회째에 3성(60%) + SSR(40%) 확정, 픽업 확률은 사용자 설정
- **주(周) 개념**: Step1~4 (40회) = 1주
- **횟수 제한**: 최대 주회 수가 정해져 있음 (가챠마다 다름, 사용자 설정)
  - 예: 최대 3주 = 120회까지만 가능
  - UI: "최대 주회(周回) 수" 입력 필드
- **주회 보상**: 각 주 완료 시 보상 1개 (사전 설정)
  - 없음: 보상 없음
  - random: 랜덤 티켓 (픽업 중 랜덤 1개)
  - select: 셀렉 티켓 (원하는 픽업 1개)

#### 천장 시스템
- 일반 + 스탭업 합산 200회마다 천장 1회 (셀렉 티켓)
- 횟수는 가챠 간 공유됨

#### 시뮬레이터 단순화
- Step2/Step3의 확률 증가는 **픽업 확률과 무관**하므로 시뮬레이션에서 무시
- 오직 **픽업 획득 확률**에만 집중

### 2성 가챠 시스템

#### 일반 가챠
- **픽뚫 없음**: 2성이 나오면 100% 픽업
- **확률 계산**: `개별 픽업 확률 = 전체 2성 확률 / 픽업 개수`
- **10회 보정**: 10회째에 2성 확률 95%
- **천장**: 100회마다 1회 (일반 가챠 전용)

#### 스탭업 가챠 (유료돌 전용, 그룹별)
- **그룹 구성**: 보통 4개 그룹 (A, B, C, D)으로 분할
- **확률 계산**: `개별 픽업 확률 = 전체 2성 확률 / 그룹별 픽업 개수`
- **Step 구조**:
  - Step1: 5회 (1번만 가능), 5회째 2성 100% 확정
  - Step2: 10회 (무한 반복), 10회째 2성 100% 확정
- **천장**: 그룹별 합산 50회마다 1회 (스탭업 가챠 전용)
- **독립성**: 일반 가챠와 천장 횟수 공유 안 함

### 생일 가챠 시스템

#### 일반 가챠
- 픽업 1개 고정
- 픽업 확률: 1.5% (고정)
- 천장: 200회마다 1회

#### 스탭업 가챠 (유료돌 전용)
- 픽업 확률: 2.0% (고정, 일반보다 높음)
- **Step 구조**: Step1~3, 각 10회 (총 30회)
  - Step1 (1~10회): 2.0% 확률
  - Step2 (11~20회): 2.0% 확률
  - Step3 (21~30회): 2.0% 확률
  - **30회째**: 픽업 100% 확정
- **횟수 제한**: 30회까지만 가능 (1번 한정)
- **천장**: 일반 가챠와 합산 200회마다 1회

## 개발 명령어

빌드 과정 없는 클라이언트 사이드 웹 애플리케이션입니다. 개발 시:

```bash
# scsfp/ 디렉토리를 정적 파일 서버로 실행
cd scsfp
python -m http.server 8000
# 또는
npx serve
```

브라우저에서 `http://localhost:8000/index.html` 접속

## 아키텍처

### MVVM 패턴

코드베이스는 Model-View-ViewModel 아키텍처를 따릅니다:

- **Models** ([js/model/gacha/](scsfp/js/model/gacha/)): Observable 기반 상태 컨테이너
  - [Star3GachaModel.js](scsfp/js/model/gacha/Star3GachaModel.js), [Star2GachaModel.js](scsfp/js/model/gacha/Star2GachaModel.js), [BirthdayGachaModel.js](scsfp/js/model/gacha/BirthdayGachaModel.js), [CollabGachaModel.js](scsfp/js/model/gacha/CollabGachaModel.js)
  - 도메인 엔티티의 데이터 구조 정의

- **ViewModels** ([js/viewmodel/gacha/](scsfp/js/viewmodel/gacha/)): 프레젠테이션 로직
  - 모두 [BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js) 상속
  - 모델과 뷰를 연결, 사용자 상호작용 처리, core 서비스 오케스트레이션

- **Views** ([js/view/](scsfp/js/view/)): UI 렌더링
  - [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)가 모든 가챠 타입의 결과 렌더링
  - DOM 조작 및 Chart.js 통합

- **Core** ([js/core/](scsfp/js/core/)): 앱 특화 도메인 로직
  - [SectionManager.js](scsfp/js/core/SectionManager.js): SPA 섹션 전환 및 히스토리 관리
  - [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP 상태 전이, 컨벌루션
  - [GachaConstants.js](scsfp/js/core/GachaConstants.js): 모든 설정 상수 및 가챠 규칙
  - [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js): 효율 계산 서비스 클래스
  - [SharedSettings.js](scsfp/js/core/SharedSettings.js): 가챠 간 공유 설정 관리 (싱글톤)

- **Utils** ([js/utils/](scsfp/js/utils/)): 프로젝트 간 재사용 가능한 범용 컴포넌트
  - [Observable.js](scsfp/js/utils/Observable.js): 반응형 데이터 바인딩 패턴
  - [ProbabilityValidator.js](scsfp/js/utils/ProbabilityValidator.js): 확률 검증 및 클램핑
  - [ChartAdapter.js](scsfp/js/utils/ChartAdapter.js): Chart.js 래퍼
  - 도메인 특화 임포트 없이 독립적으로 동작

### 폴더 구조 기준

각 폴더는 명확한 책임과 재사용성 기준을 따릅니다:

#### `utils/` - 프로젝트 간 재사용 가능
```
✅ 범용 유틸리티 (Observable, 검증기, 포매터)
✅ 도메인 특화 임포트 없음
✅ 독립 npm 패키지로 배포 가능
✅ 다른 프로젝트에서도 그대로 사용 가능
```

#### `core/` - 앱 특화 도메인 로직
```
✅ 비즈니스 규칙 및 계산 (가챠 시스템 전용)
✅ 도메인 특화 서비스 및 엔진
✅ 설정 및 상수 (GACHA_RULES 등)
✅ "데이터를 어떻게 처리하는가" 표현
```

#### `model/` - 도메인 엔티티
```
✅ 상태 컨테이너 (Observable 기반)
✅ 데이터 구조 정의 및 직렬화 (toJSON/fromJSON)
✅ "어떤 데이터가 존재하는가" 표현
✅ 비즈니스 로직 없이 순수 데이터 저장
```

#### `viewmodel/` - 프레젠테이션 로직
```
✅ 모델과 뷰 연결
✅ 사용자 입력 처리 및 검증
✅ core 서비스 호출 및 결과 조합
```

#### `view/` - UI 렌더링
```
✅ DOM 조작 및 이벤트 바인딩
✅ Chart.js 등 UI 라이브러리 통합
✅ 시각적 표현만 담당
```

### 진입점

1. [index.html](scsfp/index.html) - 메인 UI (3성/생일/2성 탭)
2. [js/main.js](scsfp/js/main.js) - 앱 초기화, ViewModel 인스턴스 생성

### ViewModel 생명주기 관리

#### 현재 전략: Persistent ViewModels

모든 ViewModel은 앱 시작 시 1회 생성되며, 섹션 전환 시에도 유지됩니다.

```javascript
// main.js - 앱 시작 시 모든 ViewModel 생성
const star3VM = new Star3GachaViewModel(star3Model, star3View);
const star2VM = new Star2GachaViewModel(star2Model, star2View);
const bdVM = new BirthdayGachaViewModel(bdModel, bdView);
const collabVM = new CollabGachaViewModel(collabModel, collabView);
const paymentVM = new PaymentViewModel();

// SectionManager: CSS로만 섹션 숨김/표시
// ViewModel은 파괴하지 않고 계속 유지
```

**장점**:
- ✅ 사용자 입력 데이터 유지 (섹션 전환 후 돌아와도 입력값 보존)
- ✅ 섹션 전환 속도 빠름 (재생성 오버헤드 없음)
- ✅ 메모리 사용량 예측 가능 (~5MB)

#### destroy() 메서드

모든 ViewModel에 `destroy()` 메서드가 구현되어 있습니다.

```javascript
class BaseGachaViewModel {
    constructor() {
        this._subscriptions = [];    // Observable 구독
        this._inputBinders = [];      // InputBinder 인스턴스
    }

    destroy() {
        // Observable 구독 해제
        this._subscriptions.forEach(unsub => unsub());
        this._subscriptions = [];

        // InputBinder 해제
        this._inputBinders.forEach(binder => binder.destroy());
        this._inputBinders = [];
    }
}
```

**현재 상태**:
- ✅ 모든 ViewModel에 구현 완료
- ❌ **실제로 호출하지 않음** (브라우저가 페이지 종료 시 자동으로 메모리 정리)
- 📝 향후 필요 시 활성화 예정

#### destroy() 호출이 필요한 시점 (향후 고려사항)

**필요 없는 경우** (현재 상태):
- 섹션 5개 이하
- ViewModel당 메모리 < 1MB
- 사용자가 섹션 간 자주 이동
- 입력값 보존이 중요한 UX

**고려가 필요한 경우**:
- 섹션 10개 이상으로 확장
- 각 섹션이 Chart.js 인스턴스 10개 이상 사용
- 모바일 환경 지원 (메모리 제한)
- 장시간 사용 시 성능 저하 리포트 발생

**필수인 경우**:
- 동영상/3D 렌더링 섹션 추가
- WebWorker 사용
- IndexedDB 연결 관리
- WebSocket 연결 관리

#### InputBinder 설계

[InputBinder.js](scsfp/js/view/component/InputBinder.js)는 Instance 기반 클래스로 설계되어 있습니다.

```javascript
// ViewModel에서 사용
class BaseGachaViewModel {
    bindInputs() {
        const el = document.getElementById('someInput');
        const binder = new InputBinder(el, observable, options);
        this._inputBinders.push(binder); // 인스턴스 저장
    }

    destroy() {
        // InputBinder가 자체적으로 리소스 정리
        this._inputBinders.forEach(binder => binder.destroy());
    }
}
```

**설계 이유**:
- ✅ 책임의 명확한 분리 (InputBinder가 자신의 생명주기 관리)
- ✅ 메모리 누수 방지 (Observable 구독 + DOM 이벤트 리스너 모두 정리)
- ✅ 디버깅 용이 (인스턴스 추적 가능)

### 핵심 알고리즘

**동적 계획법 상태**: `dp[k]` = 정확히 k개를 수집한 확률

**핵심 연산** ([ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)):
- `runSinglePull(dp, prob)`: 개별 확률로 단일 가챠 수행
- `runGuaranteedPull(dp)`: 천장/확정 메커니즘 (100% 획득)
- `runRandomTicket(dp, poolSize)`: 랜덤 티켓 보상 (각 아이템당 1/poolSize)
- `convolve(dpA, dpB)`: 독립 확률 분포 합성 (2성 그룹 분석용)

**가챠 규칙** ([GachaConstants.js:59-78](scsfp/js/core/GachaConstants.js#L59-L78)):
```javascript
GACHA_RULES = {
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
}
```

## 가챠 타입별 구현

### 3성 가챠 ([Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js))

**기능**:
- 일반 가챠: 개별 픽업 확률
- 스탭업 가챠: 40회 주기, Step4 확률 부스트
- 주회 보상: 랜덤 티켓 (1/N) 또는 셀렉 티켓 (천장)
- 천장: 200회마다 (일반+스탭업 합산)
- CDF 역추적: 목표 확률 달성에 필요한 가챠 횟수 계산

**계산 흐름** (161-243줄):
1. 기본 확률로 일반 가챠 수행
2. 스탭업 가챠 수행, Step4 체크 (i % 40 === 0) 및 주회 보상 적용
3. 천장 티켓 적용 (셀렉 보상 + floor(totalPulls/200))

**주회 보상 시스템** ([Star3GachaViewModel.js:195-207](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js#L195-L207)):
- `loopRewards` 객체가 루프 번호 (1, 2, 3...)를 'random' 또는 'select'에 매핑
- Random: `runRandomTicket(dp, N)` 호출 - 모든 아이템 동일 확률
- Select: 천장 카운터 증가

### 2성 가챠 ([Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js))

**기능**:
- 4개 독립 그룹 (A, B, C, D), 각각 별도 스탭업 풀
- 컨벌루션으로 그룹 결과 합성
- 스탭업 확정: 5회, 15회, 25회...
- 일반 가챠: 10회마다 95% 보정
- 천장: 일반 100회, 스탭업 50회

**그룹 타겟팅** (142-154줄):
- `viewTargetGroup`: 'ALL' 또는 특정 그룹 ('A', 'B', 'C', 'D')
- 미선택 그룹의 targetCount는 0으로 강제
- 모든 타겟이 0이면 전체 수집 모드 (M=N)

### 생일 가챠 ([BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js))

**기능**:
- 일반 가챠: 1.5% 확률
- 스탭업 가챠: 2.0% 확률, 최대 30회
- 30회째 스탭업: 100% 확정 획득
- 천장: 200회마다 (합산)

### 콜라보 가챠 ([CollabGachaViewModel.js](scsfp/js/viewmodel/gacha/CollabGachaViewModel.js))

**기능**:
- 생일 가챠와 유사하지만 스탭업 횟수 제한 없음 (9999회)
- Step3 확정 기능 없음 (확률만 증가)
- 프리셋 지원 (본가 2탄 등)
- 일반 확률: 0.75% (본가 기준)
- 스탭업 확률: 1.0% (본가 기준)

## 상태 관리

**Observable 패턴** ([Observable.js](scsfp/js/core/Observable.js)):
- 모든 모델 속성이 Observable 인스턴스
- 변경 시 구독을 통해 `calculate()` 및 `save()` 트리거
- `isInitializing` 플래그로 로드 중 연쇄 재계산 방지

**LocalStorage** ([StorageManager.js](scsfp/js/utils/StorageManager.js)):
- 키: `shani_gacha_3star`, `shani_gacha_2star`, `shani_gacha_birthday`
- 저장: 픽업 수, 확률, 주회 설정, 보상 선택
- 미저장: 뽑기 횟수 (`normalPulls`, `stepPulls`) - 의도된 설계

**입력 바인딩** ([InputBinder.js](scsfp/js/view/component/InputBinder.js)):
- HTML 입력과 Observable 속성 간 양방향 바인딩
- `ProbabilityValidator.clamp()`를 통한 자동 검증
- 타입 변환: 'int' 또는 'float'

## 주요 파일

- [GachaConstants.js](scsfp/js/core/GachaConstants.js): 모든 설정, 입력 정의, 프리셋, 가챠 규칙 (`GACHA_RULES`)
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP 알고리즘, 모든 확률 계산에 `ProbabilityValidator` 필수
- [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js): 모든 가챠 타입의 효율 계산 서비스
- [ProbabilityValidator.js](scsfp/js/utils/ProbabilityValidator.js): 확률 클램핑, 총 확률 계산 (`getTotalProb`), 누적 분포 보정
- [PROJECT_STATUS.md](scsfp/PROJECT_STATUS.md): 코드베이스 구조, 기술 부채, 알고리즘 설명 상세 분석 (한글)

## Chart.js 연동

**라이브러리 로딩** ([index.html](scsfp/index.html)):
```html
<!-- Chart.js와 ChartDataLabels CDN으로 로드 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0"></script>
```

**등록** ([main.js:10](scsfp/js/main.js#L10)):
```javascript
Chart.register(ChartDataLabels); // CDN의 전역 변수
```

**차트 렌더링** ([ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)):
- 일관된 스타일링을 위한 Chart.js 래퍼
- `chart.update('none')` 사용으로 기존 차트 재활용 (성능 최적화)

## 공통 패턴

### 새 가챠 타입 추가

1. [GachaConstants.js](scsfp/js/core/GachaConstants.js)에 `CONFIG.NEW_TYPE` 추가
2. [js/model/gacha/](scsfp/js/model/gacha/)에 `NewTypeGachaModel.js` 생성
3. [BaseGachaViewModel](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js) 상속하여 `NewTypeGachaViewModel.js` 생성
4. [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)에 렌더링 로직 추가
5. [index.html](scsfp/index.html)에 탭 추가
6. [main.js](scsfp/js/main.js)에 인스턴스 추가

### 확률 계산 안전성

**반드시 ProbabilityValidator 사용**:
```javascript
// 개별 확률을 [0, 1]로 클램핑
const validProb = ProbabilityValidator.clamp(prob);

// M개 아이템에 대한 총 확률 계산
// 엣지 케이스 처리: p × M > 1.0
const p_any = ProbabilityValidator.getTotalProb(p_indiv, M);
```

### ViewModel 라이프사이클

```javascript
constructor() {
  this.isInitializing = true; // 연쇄 업데이트 방지
}

init() {
  // 1. 스토리지에서 로드
  // 2. Observable 변경 구독
  // 3. 입력 바인딩
  this.isInitializing = false;
  this.calculate(); // 초기 계산
}

calculate() {
  // 1. 모델 값 읽기
  // 2. DP 시뮬레이션 수행
  // 3. View를 통해 결과 렌더링
}
```

## 기술 부채

### 해결됨 (2026-01-20)
1. ~~**효율 계산 코드 중복**~~: [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js)로 추출
2. ~~**ViewModel에서 DOM 조작**~~: [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)에서 제거, InputBinder의 `maxObserver` 사용
3. ~~**마법 숫자**~~: 모든 가챠 규칙이 [GachaConstants.js](scsfp/js/core/GachaConstants.js)의 `GACHA_RULES` 상수 사용
4. ~~**CDF 계산 중복**~~: `_calculateCDFData`를 [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js)의 `calculate3StarCDF`로 위임
5. ~~**ViewModel 내 그룹 계산**~~: `_calcGroup` 로직을 [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)의 `calcStepupGroup`으로 이동
6. ~~**차트 재렌더링**~~: [ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)에서 `chart.update('none')` 사용으로 최적화

### 남은 항목
- 현재 없음 (모든 기술 부채 해결 완료)

## 필수 규칙

1. **모든 확률 계산은 반드시 ProbabilityValidator 사용** - 안전성
2. **`isInitializing = true` 동안 Observable 값 수정 금지** - 연쇄 방지
3. **Chart.js는 CDN의 전역 변수** - import 문 없음
4. **천장 카운트는 `Math.floor()` 사용** - 소수점 천장은 버림
5. **뽑기 횟수는 LocalStorage에 저장 안 함** - 의도된 설계
6. **DP 배열은 0-인덱스** - 수집 개수 표현 (0부터 M개)
7. **GACHA_RULES 상수 사용** - 하드코딩된 마법 숫자 (40, 200, 50 등) 대신
8. **EfficiencyCalculator 사용** - ViewModel에 효율 계산 로직 중복 대신

## 관련 문서

프로젝트의 업데이트 히스토리와 향후 리팩토링 기회는 별도 문서로 관리됩니다:

- **[UPDATE.md](UPDATE.md)**: 모든 업데이트 내역 (기능 추가, 버그 수정, 개선 사항)
- **[REFACTORING.md](REFACTORING.md)**: 향후 리팩토링 기회 및 기술 부채 관리
- **[PROJECT_STATUS.md](scsfp/PROJECT_STATUS.md)**: 코드베이스 구조, 알고리즘 상세 분석 (한글)
