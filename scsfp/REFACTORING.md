# REFACTORING.md

코드베이스 검토 결과 중 미실행 항목을 기록합니다. 필요 시 참조용.

---

## 검토 완료 (실행 불필요 또는 보류)

### PaymentViewModel 책임 분리 (516줄)

**현황**: 18개 메서드, 패키지 테이블/페스 테이블/무돌 분석/통화 토글/효율 토글/클릭·호버 이벤트 처리

**소견**: 렌더링은 이미 PaymentView에 위임 중이므로 MVVM 위반은 아님. 516줄은 허용 범위이며, 과금 탭이 3개뿐이라 탭별 Controller 분리의 이점이 파일 분산 비용 대비 제한적.

**판단**: 보류 — 과금 섹션 규모가 크게 확장되지 않는 한 현재 구조 유지

---

### context 객체 구조화

**현황**: 각 ViewModel의 calculate()가 context를 리터럴 객체로 조립. Star3(19개), Star2(11개), Birthday/Collab(11개) 프로퍼티.

**소견**: Vanilla JS 프로젝트에서 클래스/인터페이스 정형화의 런타임 보호 효과 없음. JSDoc `@typedef` 문서화 정도가 적절.

**판단**: 보류 — TypeScript 도입 시 재검토

---

### ChartAdapter vs GachaResultView 차트 생성 분리

**현황**: ChartAdapter에 renderPieChart/BarChart/LineChart 3개 래퍼. GachaResultView.renderEfficiencyChart()만 직접 `new Chart()` 호출 (cdfLinePlugin 커스텀 플러그인 필요).

**소견**: 효율 차트는 CDF 라인 오버레이, 이중 마커, 커스텀 범례 등 특수 요구사항이 많아 범용 래퍼에 통합하면 ChartAdapter가 비대해짐. 직접 생성 1건뿐이므로 중복 비용 미미.

**판단**: 불필요 — 현재 구조 유지

---

### 이벤트 바인딩 플래그 패턴

**현황**: PaymentViewModel에 `_clickHandlerBound`, `_fesClickHandlerBound` 2개 boolean 플래그.

**소견**: 2개 플래그로 EventDelegator 유틸리티 클래스를 만드는 것은 과잉 추상화.

**판단**: 불필요 — 현재 패턴 유지
