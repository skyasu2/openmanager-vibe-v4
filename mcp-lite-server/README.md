# MCP Lite Server

OpenManager Vibe V4의 백엔드 서버 컴포넌트로, 자연어 처리를 위한 간단한 API를 제공합니다.

## 목적 및 기능

- 프론트엔드 자연어 쿼리 처리를 위한 백엔드 서비스 제공
- 컨텍스트 기반 쿼리-응답 매칭 기능
- CORS 지원 및 API 요청 처리

## 주요 기능

- **REST API**: `/query` 엔드포인트를 통한 자연어 처리
- **컨텍스트 관리**: `context` 폴더 내 텍스트 파일 기반 응답 시스템
- **CORS 설정**: Netlify 프론트엔드(https://openvibe3.netlify.app)와의 안전한 통신

## 기술 스택

- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **파일 기반 데이터 저장**: 텍스트 파일에 컨텍스트 정보 저장

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 서버 실행
node server.js
```

기본적으로 서버는 3000번 포트에서 실행됩니다. `PORT` 환경 변수를 통해 변경 가능합니다.

## API 사용법

### 쿼리 엔드포인트

**POST /query**

요청 본문:
```json
{
  "query": "CPU 사용률이 높은 서버는?",
  "context": "server-status"
}
```

응답:
```json
{
  "result": "CPU 사용률이 높은 서버는 web-03, app-05, db-02로 확인됩니다."
}
```

## 컨텍스트 관리

`context` 폴더에 다양한 컨텍스트 파일(`.txt`)을 저장하여 시스템의 응답을 커스터마이즈할 수 있습니다:

- **server-status.txt**: 서버 상태 관련 쿼리에 대한 응답
- **alerts.txt**: 알림 및 경고 관련 응답
- **performance.txt**: 성능 관련 쿼리에 대한 응답

## 배포 정보

- **배포 플랫폼**: Render.com
- **URL**: https://openmanager-vibe-v4.onrender.com
- **자동 배포**: GitHub 저장소 main 브랜치에 푸시 시 자동 배포

## 개발 가이드라인

백엔드 개발은 프론트엔드와 달리 기능 개선에 제약이 적습니다:
- 새로운 API 엔드포인트 추가 가능
- 성능 최적화 자유롭게 진행 가능
- 컨텍스트 파일 확장 및 응답 로직 개선 권장

## 주의사항

현재는 간단한 키워드 매칭 방식으로 자연어 처리를 시뮬레이션하고 있습니다. 실제 LLM 연동이 아닌 시연용 구현임을 유의하세요. 