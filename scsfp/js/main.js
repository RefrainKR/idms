import { Star3GachaViewModel } from './viewmodel/gacha/Star3GachaViewModel.js';
import { Star2GachaViewModel } from './viewmodel/gacha/Star2GachaViewModel.js';
import { BirthdayGachaViewModel } from './viewmodel/gacha/BirthdayGachaViewModel.js';
import { TabManager } from './view/component/TabManager.js';
import { CollapsibleSection } from './view/component/CollapsibleSection.js';

Chart.register(ChartDataLabels);

window.onload = function() {
    // 1. ViewModel 초기화
    const star3VM = new Star3GachaViewModel();
    const star2VM = new Star2GachaViewModel();
    const birthdayVM = new BirthdayGachaViewModel();

    star3VM.init();
    star2VM.init();
    birthdayVM.init();

    // 2. UI 컴포넌트 활성화
    new CollapsibleSection(); // 섹션 토글 기능

    // 3. 탭 매니저 연결 (탭 전환 시 강제 렌더링)
    new TabManager(document.getElementById('main-tab-system'), (id) => {
        if (id === 'tab-3star') star3VM.calculate();
        else if (id === 'tab-birthday') birthdayVM.calculate();
        else star2VM.calculate();
    });

    // 서브 탭 시스템 연결
    const sub3 = document.getElementById('sub-tab-system-3star');
    if (sub3) new TabManager(sub3, (tabId) => star3VM.onTabChange(tabId));

    const subBirthday = document.getElementById('sub-tab-system-birthday');
    if (subBirthday) new TabManager(subBirthday, (tabId) => birthdayVM.onTabChange(tabId));

    const sub2 = document.getElementById('sub-tab-system-2star');
    if (sub2) new TabManager(sub2, (tabId) => star2VM.onTabChange(tabId));
    
    // 초기 로딩 시 현재 활성 탭에 맞춰 UI 설정
    const initialTab3 = sub3.querySelector('.tab-button.active').dataset.tab;
    star3VM.onTabChange(initialTab3);
    
    const initialTabBirthday = subBirthday.querySelector('.tab-button.active').dataset.tab;
    birthdayVM.onTabChange(initialTabBirthday);
    
    const initialTab2 = sub2.querySelector('.tab-button.active').dataset.tab;
    star2VM.onTabChange(initialTab2);
};