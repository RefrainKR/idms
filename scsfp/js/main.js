import { Star3GachaViewModel } from './viewmodel/gacha/Star3GachaViewModel.js';
import { Star2GachaViewModel } from './viewmodel/gacha/Star2GachaViewModel.js';
import { TabManager } from './view/component/TabManager.js';
import { CollapsibleSection } from './view/component/CollapsibleSection.js';

Chart.register(ChartDataLabels);

window.onload = function() {
    // 1. ViewModel 초기화
    const star3VM = new Star3GachaViewModel();
    const star2VM = new Star2GachaViewModel();

    star3VM.init();
    star2VM.init();

    // 2. UI 컴포넌트 활성화
    new CollapsibleSection(); // 섹션 토글 기능

    // 3. 탭 매니저 연결 (탭 전환 시 강제 렌더링)
    new TabManager(document.getElementById('main-tab-system'), (id) => {
        if (id === 'tab-3star') star3VM.calculate();
        else star2VM.calculate();
    });

    // 서브 탭들도 연결 (누를 때마다 최신 데이터로 갱신)
    const sub3 = document.getElementById('sub-tab-system-3star');
    if (sub3) new TabManager(sub3, () => star3VM.calculate());

    const sub2 = document.getElementById('sub-tab-system-2star');
    if (sub2) new TabManager(sub2, () => star2VM.calculate());
};