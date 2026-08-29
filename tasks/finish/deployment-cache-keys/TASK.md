---
status: done
planning_role: Sol
implementation_role: Sol
review_role: Sol
branch: v.1.12.X
version: 1.12.2
next_role: none
---

# GitHub Pages 배포 캐시 키 자동화

## 목적

애플리케이션의 모듈 구조와 고정 파일명을 유지하면서, 릴리스마다 여러 파일의 `?v=`를 수동 수정하지 않아도 모든 로컬 JavaScript 및 CSS 요청이 같은 배포판의 캐시 키를 사용하게 합니다.

## 허용 범위

- 원본 HTML과 JavaScript에서 수동 캐시 쿼리 제거
- Jekyll 산출물에 Git 커밋 SHA 기반 `v` 쿼리를 삽입하는 무의존성 Node 스크립트
- 변환 누락 및 잘못된 외부 URL 변환 검사
- GitHub Pages workflow에 변환·검사 단계 추가
- 캐시 관리 규칙 및 작업 문서 갱신

## 금지 범위

- 가챠 계산, 게임 규칙, UI 동작 변경
- JavaScript 번들링 또는 프레임워크 도입
- 생성된 배포 산출물 커밋
- 사용자 승인 없는 `main` 병합·배포

## 완료 조건

- 저장소 원본의 로컬 JS/CSS 참조에 `?v=`가 없음
- 배포 사본의 모든 로컬 JS/CSS 참조에 동일한 SHA 기반 `v` 값이 있음
- 외부 CDN URL은 원형을 유지함
- 기존 쿼리와 fragment가 있어도 안전하게 `v`만 교체함
- 변환 누락이나 잘못된 키가 있으면 검사가 실패함
- 로컬 배포 사본에서 애플리케이션이 정상 초기화됨
