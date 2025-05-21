# OpenManager Vibe V4

## 프로젝트 개요

OpenManager Vibe V4는 서버 모니터링 및 AI 기반 분석 대시보드입니다. 이벤트 기반 아키텍처를 사용하여 컴포넌트 간 느슨한 결합을 구현하고, 유지보수성과 확장성을 높였습니다.

## 주요 기능

- 서버 상태 실시간 모니터링
- CPU, 메모리, 디스크 사용량 시각화
- AI 기반 자연어 쿼리 및 분석
- 서버 성능 문제 자동 탐지 및 제안

## 아키텍처

### 컴포넌트 다이어그램

```
+----------------+      +----------------+      +----------------+
|   Dashboard    |      |  AIProcessor   |      |  ChartManager  |
+----------------+      +----------------+      +----------------+
         |                      |                      |
         v                      v                      v
+----------------------------------------------------------+
|                        EventBus                          |
+----------------------------------------------------------+
         ^                      ^                      ^
         |                      |                      |
+----------------+      +----------------+      +----------------+
|ServerDataService|     |   AIService    |      | 기타 서비스     |
+----------------+      +----------------+      +----------------+
```

### 주요 컴포넌트

1. **EventBus**: 모든 컴포넌트 간 통신의 중심점으로, 이벤트 기반 아키텍처 구현
2. **Dashboard**: 서버 상태 및 메트릭 표시, 서버 목록 및 필터링 관리
3. **AIProcessor**: AI 쿼리 입력 처리 및 응답 표시, 컨텍스트 기반 쿼리 제안
4. **ChartManager**: 차트 및 데이터 시각화 관리
5. **ServerDataService**: 서버 데이터 요청 및 관리
6. **AIService**: AI 쿼리 처리 및 응답 생성

### 이벤트 흐름

주요 이벤트와 해당 이벤트를 발행하고 구독하는 컴포넌트:

| 이벤트 | 발행자 | 구독자 | 설명 |
|-------|-------|-------|------|
| servers:data-updated | ServerDataService | Dashboard, ChartManager | 서버 데이터 업데이트 |
| server:selected | Dashboard | AIProcessor, ChartManager | 사용자가 서버 선택 |
| ai:response-received | AIService | Dashboard, ChartManager | AI 응답 수신 |
| filter:changed | Dashboard | AIProcessor | 서버 필터 변경 |
| context:updated | 여러 컴포넌트 | AIProcessor | 컨텍스트 정보 변경 |
| error | 여러 컴포넌트 | Dashboard | 오류 발생 |

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage
```

## 테스트

프로젝트는 Jest 기반의 테스트 프레임워크를 사용합니다:

- **단위 테스트**: 개별 컴포넌트 및 서비스 테스트
- **통합 테스트**: 컴포넌트 간 상호작용 테스트
- **커버리지 리포트**: `npm run test:coverage` 실행 후 `coverage/lcov-report/index.html` 확인

```bash
# 테스트 의존성 설치
npm install --save-dev jest @babel/core @babel/preset-env babel-jest @testing-library/dom @testing-library/jest-dom

# 모든 테스트 실행
npm test

# 개발 중 테스트 자동 실행
npm run test:watch

# 테스트 커버리지 확인
npm run test:coverage
```

## 개발 가이드

### 새 컴포넌트 추가

1. 컴포넌트 클래스 생성 (`components/` 디렉토리)
2. EventBus 구독 설정
3. 필요한 서비스 주입
4. DOM 요소 참조 및 이벤트 리스너 설정

### 새 이벤트 추가

1. 적절한 이벤트 이름 정의 (형식: `domain:action`)
2. 발행 컴포넌트에서 `EventBus.publish()` 호출
3. 구독 컴포넌트에서 `EventBus.subscribe()` 설정

### 테스트 주도 개발(TDD)

1. 테스트 코드 작성
2. 테스트 실행 및 실패 확인
3. 최소한의 코드로 테스트 통과
4. 코드 리팩토링 및 테스트 유지

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
const API_URL = "https://openmanager-vibe-v4.onrender.com/query";
```

## 데모 사용 시 주의사항

현재 이 프론트엔드는 실제 서버 데이터 대신 `fixed_dummy_data.js`에서 생성된 가상 데이터를 사용합니다. 시연 목적으로 설계되었으며 실제 서버 모니터링에는 백엔드 연동이 필요합니다. 