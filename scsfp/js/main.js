// GitHub Pages의 ES module 캐시는 상위 main.js의 쿼리를 하위 import에 전파하지 않는다.
// 배포 workflow가 생성 산출물의 모든 로컬 JS/CSS 참조에 같은 커밋 SHA를 붙인다.
import { Star3GachaViewModel } from './viewmodel/gacha/Star3GachaViewModel.js';
import { Star2GachaViewModel } from './viewmodel/gacha/Star2GachaViewModel.js';
import { BirthdayGachaViewModel } from './viewmodel/gacha/BirthdayGachaViewModel.js';
import { CollabGachaViewModel } from './viewmodel/gacha/CollabGachaViewModel.js';
import { PaymentViewModel } from './viewmodel/payment/PaymentViewModel.js';
import { TabManager } from './component/TabManager.js';
import { CollapsibleSection } from './component/CollapsibleSection.js';
import { StorageManager } from './utils/StorageManager.js';
import { SectionManager } from './component/SectionManager.js';

// Chart.js and ChartDataLabels are loaded as global variables via CDN (see index.html)
// Chart.js: https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
// ChartDataLabels: https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0
Chart.register(ChartDataLabels);

window.onload = function() {
    // 0. 버전 체크 및 마이그레이션
    StorageManager.init();

    const resetAllButton = document.getElementById('app-reset-all-btn');
    if (resetAllButton) {
        resetAllButton.addEventListener('click', () => {
            const confirmed = confirm('저장된 모든 가챠·과금 설정을 초기화하시겠습니까?');
            if (!confirmed) return;

            // 배포 직후 이전 StorageManager 모듈 캐시와 혼재해도 전체 초기화는 동작한다.
            if (typeof StorageManager.clearAll === 'function') StorageManager.clearAll();
            else localStorage.clear();
            location.reload();
        });
    }

    // 1. 섹션 관리자 초기화
    const sectionManager = new SectionManager();

    // 2. ViewModel 초기화
    const star3VM = new Star3GachaViewModel();
    const star2VM = new Star2GachaViewModel();
    const birthdayVM = new BirthdayGachaViewModel();
    const collabVM = new CollabGachaViewModel();
    const paymentVM = new PaymentViewModel();

    star3VM.init();
    star2VM.init();
    birthdayVM.init();
    collabVM.init();
    paymentVM.init();

    // 3. UI 컴포넌트 활성화
    new CollapsibleSection(); // 섹션 토글 기능

    // 4. 메인 탭 네비게이션 설정 (가챠 섹션)
    const gachaSection = document.querySelector('#gacha-section');
    if (gachaSection) {
        new TabManager(gachaSection, (tabId) => {
            // ViewModel 계산 트리거
            if (tabId === 'tab-3star') star3VM.calculate();
            else if (tabId === 'tab-birthday') birthdayVM.calculate();
            else if (tabId === 'tab-collab') collabVM.calculate();
            else if (tabId === 'tab-2star') star2VM.calculate();
        });
    }

    // 5. 메인 탭 네비게이션 설정 (과금 효율 섹션)
    const paymentTabSystem = document.querySelector('#payment-tab-system');
    if (paymentTabSystem) {
        new TabManager(paymentTabSystem);
    }

    // 서브 탭 시스템 연결
    const sub3 = document.getElementById('sub-tab-system-3star');
    if (sub3) new TabManager(sub3, (tabId) => star3VM.onTabChange(tabId));

    const subBirthday = document.getElementById('sub-tab-system-birthday');
    if (subBirthday) new TabManager(subBirthday, (tabId) => birthdayVM.onTabChange(tabId));

    const subCollab = document.getElementById('sub-tab-system-collab');
    if (subCollab) new TabManager(subCollab, (tabId) => collabVM.onTabChange(tabId));

    const sub2 = document.getElementById('sub-tab-system-2star');
    if (sub2) new TabManager(sub2, (tabId) => star2VM.onTabChange(tabId));

    // 초기 로딩 시 현재 활성 탭에 맞춰 UI 설정
    const initialTab3 = sub3.querySelector('.tab-button.active').dataset.tab;
    star3VM.onTabChange(initialTab3);

    const initialTabBirthday = subBirthday.querySelector('.tab-button.active').dataset.tab;
    birthdayVM.onTabChange(initialTabBirthday);

    const initialTabCollab = subCollab.querySelector('.tab-button.active').dataset.tab;
    collabVM.onTabChange(initialTabCollab);

    const initialTab2 = sub2.querySelector('.tab-button.active').dataset.tab;
    star2VM.onTabChange(initialTab2);
};
