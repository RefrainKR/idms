# 결과

## 구현 결과

- 저장소 원본의 HTML·JavaScript에서 수동 `?v=1.12.2`를 제거했습니다.
- `scripts/apply-deployment-cache-key.mjs`가 배포 사본의 로컬 JS/CSS 참조에 현재 커밋 SHA 앞 12자리를 `v` 쿼리로 추가합니다.
- 기존 쿼리와 fragment는 보존하며 `v` 값만 교체합니다.
- 외부 URL과 특수 scheme은 변환하지 않습니다.
- 원본 청결 검사와 배포 산출물 일치 검사가 누락·불일치 시 실패합니다.
- GitHub Pages workflow는 runner의 임시 배포 소스를 변환한 뒤 Jekyll로 빌드하고, 다시 검사한 산출물만 업로드합니다.

## 개발자에게 보이는 상태

원본과 GitHub 저장소에서는 다음처럼 유지됩니다.

```js
import { StorageManager } from './utils/StorageManager.js';
```

배포 산출물에서만 다음처럼 변환됩니다.

```js
import { StorageManager } from './utils/StorageManager.js?v=64e232a851b1';
```

사용자용 `APP_VERSION`은 캐시 키와 별도로 기존처럼 한 곳에서 관리합니다.

## 검증 결과

- 스크립트 단위 테스트 2개 통과
- 원본 참조 105개 청결 검사 통과
- 배포 사본 참조 105개 동일 SHA 변환·검사 통과
- 격리 Chrome에서 로컬 JS/CSS 요청 40개 모두 동일 SHA 확인
- Chrome 런타임 예외 0건, 앱 버전 `1.12.2`, canvas 12개 확인
- 외부 CDN URL에 배포 SHA가 추가되지 않음을 확인

## 현재 결론

로컬 시뮬레이션 검증과 사용자 승인을 마치고 실제 `main` 배포 검증 단계로 전환했습니다.

### 실제 Actions 보완

- 최초 `main` 실행에서는 Jekyll Docker action이 생성한 `_site`를 이후 단계에서 수정하는 작업이 실패해 배포가 안전하게 중단됐습니다.
- 변환 단계를 Jekyll 빌드 전 runner의 임시 checkout 소스에 적용하도록 옮겼습니다.
- Jekyll이 만든 `_site`는 수정하지 않고 동일 SHA가 보존됐는지만 검사합니다.

## 커밋 전 공개 범위 점검

- `.vscode/`는 로컬에 유지하면서 Git 추적에서 제거했습니다.
- 경로 깊이에 관계없이 이름이 `primary`인 디렉터리와 전체 하위 트리를 무시합니다.
- 기존 개인 게임 참고 이미지는 `scsfp/docs/game/primary/img/`로 이동했습니다.
- 환경 파일, 개인 키·인증서, dependency/build/coverage 산출물, 로그와 일반 IDE·OS 임시 파일의 기본 ignore 규칙을 추가했습니다.
- 현재 추적 파일명과 대표 자격증명 패턴을 검사했으며 추가 노출 후보는 발견하지 못했습니다.
- `AGENTS.md`, `tasks/`, `scripts/`는 계속 추적 가능합니다.
