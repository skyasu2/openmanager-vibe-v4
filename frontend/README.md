# OpenManager Vibe V4 - 프론트엔드

OpenManager Vibe V4의 프론트엔드 부분입니다. 서버 모니터링 대시보드와 자연어 기반 질의 UI를 제공합니다.

## 목적 및 기능

- 서버 관리자를 위한 직관적인 대시보드 UI 제공
- 자연어 기반 서버 모니터링 및 분석 지원
- 시각적 서버 상태 표시 및 필터링 기능
- 문제 분석 보고서 자동 생성

## 구성 요소

- **index.html**: 메인 랜딩 페이지
- **server_dashboard.html**: 서버 모니터링 대시보드
- **server_detail.html**: 서버 상세 정보 페이지
- **css/**: 스타일시트 파일들
  - **modern-style.css**: 대시보드용 스타일
  - **style.css**: 기본 스타일 시트
- **js 파일들**:
  - **data_processor.js**: 데이터 처리 로직
  - **ai_processor.js**: 자연어 처리 엔진
  - **fixed_dummy_data.js**: 고정 더미 데이터
  - **summary.js**: 보고서 생성 기능
  - **agent.js**: 에이전트 스크립트

## 실행 방법

이 폴더는 순수 정적 웹 사이트이므로 어떤 정적 파일 서버로도 실행 가능합니다:

```bash
# VSCode Live Server 사용:
# VSCode에서 index.html 열고 "Go Live" 클릭

# 또는 간단한 HTTP 서버로 실행:
npx serve .

# 또는 Python으로 간단히 실행:
python -m http.server
```

## 배포 정보

- **배포 플랫폼**: Netlify
- **라이브 URL**: https://openvibe3.netlify.app
- **자동 배포**: GitHub 저장소 main 브랜치에 푸시 시 자동 배포

## 개발 가이드라인

- UI/UX 디자인은 현재 스타일을 90% 이상 유지해야 합니다
- Commit ad03d5f 기준 디자인을 준수해 주세요
- 변경이 필요한 경우 루트 README의 개발 가이드라인을 참조하세요

## MCP 서버 연동 정보

프론트엔드는 `config.js` 파일의 설정을 통해 백엔드 MCP 서버와 통신합니다:

```javascript
// API 엔드포인트 설정 예시
const API_URL = "https://openmanager-vibe-v4.onrender.com";
```

## 데모 사용 시 주의사항

현재 이 프론트엔드는 실제 서버 데이터 대신 `fixed_dummy_data.js`에서 생성된 가상 데이터를 사용합니다. 시연 목적으로 설계되었으며 실제 서버 모니터링에는 백엔드 연동이 필요합니다. 