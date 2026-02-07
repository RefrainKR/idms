import { Star3GachaViewModel } from './viewmodel/gacha/Star3GachaViewModel.js';
import { Star2GachaViewModel } from './viewmodel/gacha/Star2GachaViewModel.js';
import { BirthdayGachaViewModel } from './viewmodel/gacha/BirthdayGachaViewModel.js';
import { CollabGachaViewModel } from './viewmodel/gacha/CollabGachaViewModel.js';
import { PaymentViewModel } from './viewmodel/payment/PaymentViewModel.js';
import { TabManager } from './view/component/TabManager.js';
import { CollapsibleSection } from './view/component/CollapsibleSection.js';
import { StorageManager } from './utils/StorageManager.js';
import { SectionManager } from './core/SectionManager.js';

// Chart.js and ChartDataLabels are loaded as global variables via CDN (see index.html)
// Chart.js: https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
// ChartDataLabels: https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0
Chart.register(ChartDataLabels);

window.onload = function() {
    // 0. 버전 체크 및 마이그레이션
    StorageManager.init();

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

    // 4. 메인 탭 네비게이션 설정
    const mainTabButtons = document.querySelectorAll('.main-tab-nav .tab-button');

    mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // 모든 탭 버튼 비활성화
            mainTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 모든 탭 콘텐츠 숨김
            document.querySelectorAll('#main-tab-system > .tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            // 선택된 탭 표시
            document.getElementById(targetTab).classList.add('active');

            // ViewModel 계산 트리거
            if (targetTab === 'tab-3star') star3VM.calculate();
            else if (targetTab === 'tab-birthday') birthdayVM.calculate();
            else if (targetTab === 'tab-collab') collabVM.calculate();
            else if (targetTab === 'tab-2star') star2VM.calculate();
        });
    });

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