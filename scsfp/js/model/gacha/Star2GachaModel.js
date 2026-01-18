import { Observable } from '../../core/Observable.js';

export class Star2GachaModel {
    constructor() {
        this.countNormal = new Observable(28);
        this.rateTotal = new Observable(28.0);
        this.normalPulls = new Observable(0);

        // 그룹별 데이터 (Observable 개별 생성)
        this.countStepA = new Observable(8); this.pullsStepA = new Observable(0); this.targetCountA = new Observable(0);
        this.countStepB = new Observable(7); this.pullsStepB = new Observable(0); this.targetCountB = new Observable(0);
        this.countStepC = new Observable(7); this.pullsStepC = new Observable(0); this.targetCountC = new Observable(0);
        this.countStepD = new Observable(6); this.pullsStepD = new Observable(0); this.targetCountD = new Observable(0);

        // 옵션 (상태)
        this.ceilingMode = new Observable('included');
        this.viewMode = new Observable('individual');
        
        // 효율 탭 상태
        this.selectedGroup = new Observable('A');
        this.efficiencyMode = new Observable('best');

        this.viewTargetGroup = new Observable('ALL');
        this.efficiencyTargetGroup = new Observable('A');
    }

    /**
     * 데이터를 JSON 객체로 변환 (저장용)
     */
    toJSON() {
        return {
            countNormal: this.countNormal.value,
            rateTotal: this.rateTotal.value,
            // 횟수(pulls)는 보통 저장하지 않지만, 사용자가 원하면 포함 가능 (여기선 포함)
            // exclude 설정은 BaseGachaViewModel의 save 로직에서 처리하는 것이 일반적이나,
            // 여기서는 model이 전체 데이터를 뱉어내고 필요한 것만 저장하도록 설계됨.
            
            // 그룹 A
            countStepA: this.countStepA.value, 
            pullsStepA: this.pullsStepA.value, // 저장하고 싶지 않으면 제거 가능
            targetCountA: this.targetCountA.value,
            
            // 그룹 B
            countStepB: this.countStepB.value, 
            pullsStepB: this.pullsStepB.value,
            targetCountB: this.targetCountB.value,
            
            // 그룹 C
            countStepC: this.countStepC.value, 
            pullsStepC: this.pullsStepC.value,
            targetCountC: this.targetCountC.value,
            
            // 그룹 D
            countStepD: this.countStepD.value, 
            pullsStepD: this.pullsStepD.value,
            targetCountD: this.targetCountD.value
        };
    }

    /**
     * 저장된 데이터로 상태 복원 (로드용)
     */
    fromJSON(data) {
        if (!data) return;
        if (data.countNormal !== undefined) this.countNormal.value = data.countNormal;
        if (data.rateTotal !== undefined) this.rateTotal.value = data.rateTotal;
        
        ['A', 'B', 'C', 'D'].forEach(g => {
            // [수정] pullsStep 복원 로직 추가
            if (data[`countStep${g}`] !== undefined) this[`countStep${g}`].value = data[`countStep${g}`];
            if (data[`pullsStep${g}`] !== undefined) this[`pullsStep${g}`].value = data[`pullsStep${g}`];
            if (data[`targetCount${g}`] !== undefined) this[`targetCount${g}`].value = data[`targetCount${g}`];
        });
    }
}