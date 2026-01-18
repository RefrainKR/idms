import { Observable } from '../../core/Observable.js';

export class BirthdayGachaModel {
    constructor() {
        // 생일 가챠 기본 설정 (변경 가능성 대비)
        this.pickupCount = new Observable(1);
        this.normalRate = new Observable(1.5);
        this.stepRate = new Observable(2.0);
        
        // 사용자 입력 (매번 새로 입력하므로 저장 안 함)
        this.normalPulls = new Observable(0);
        this.stepPulls = new Observable(0);
        
        // 옵션
        this.ceilingMode = new Observable('included');
        this.viewMode = new Observable('individual');
        this.efficiencyMode = new Observable('best');
    }

    toJSON() {
        // 횟수는 저장하지 않음 (매번 새로 입력)
        return {};
    }

    fromJSON(data) {
        // 현재는 저장할 데이터가 없음
        // 향후 확장 가능성 대비
        if (!data) return;
    }
}