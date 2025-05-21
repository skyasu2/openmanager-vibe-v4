// process_query.js
import { CONFIG } from './config.js';

// MCP 서버 연동 함수 (context 인자화)
async function fetchFromMCP(query, context = "server-status") {
  try {
    // 데모 모드 또는 API 연결 실패 시 로컬 응답 제공
    if (CONFIG.USE_DEMO_MODE) {
      console.log("데모 모드에서 AI 응답 생성");
      return generateDemoResponse(query);
    }
    
    const response = await fetch(CONFIG.MCP_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        context: context
      })
    });

    if (!response.ok) throw new Error("MCP 서버 오류");

    const data = await response.json();
    return data.result || "MCP 응답이 없습니다.";
  } catch (error) {
    console.error("MCP 요청 실패:", error);
    // 오류 발생 시 로컬 응답 생성
    return generateDemoResponse(query);
  }
}

// 데모 응답 생성 함수
function generateDemoResponse(query) {
  query = query.toLowerCase();
  
  if (query.includes('cpu') || query.includes('씨피유')) {
    return "현재 CPU 사용률이 가장 높은 서버는 web-server-01(95%)입니다. 이 서버는 통계적으로 비정상적(CPU 스파이크)입니다. 원인: MySQL 서비스 연결 문제, 백그라운드 작업 증가. 권장 조치: 서비스 재시작 및 리소스 모니터링.";
  } 
  
  if (query.includes('메모리') || query.includes('램')) {
    return "메모리 누수 의심 노드: app-server-03(82%). 지속적 증가 패턴 감지. 원인: 애플리케이션 메모리 누수 가능성, 장기 실행 작업. 권장 조치: 애플리케이션 재시작, 코드 분석.";
  }
  
  if (query.includes('디스크') || query.includes('저장')) {
    return "디스크 공간 부족 서버: db-server-01(92%). 원인: 로그 파일 증가, 데이터베이스 증가. 권장 조치: 로그 로테이션 확인, 불필요한 파일 정리.";
  }
  
  if (query.includes('장애') || query.includes('문제') || query.includes('에러') || query.includes('오류')) {
    return "최근 장애가 가장 많았던 서버: web-server-01 (2회)\n주요 이벤트: MySQL 서비스 연결 실패, CPU 사용량 90% 초과\n권장 조치: 서비스 재시작 및 로드 밸런싱 검토";
  }
  
  if (query.includes('서버') || query.includes('상태')) {
    return "현재 모니터링 중인 서버 5대 중 2대가 경고 상태, 2대가 심각 상태입니다. 주요 문제는 web-server-01의 MySQL 연결 실패와 db-server-01의 디스크 공간 부족입니다.";
  }
  
  return "질문을 이해하지 못했습니다. 서버 상태, CPU 사용률, 메모리 누수, 디스크 공간, 장애 이력 등에 대해 물어보세요.";
}

// MCP 우선, 실패 시 로컬 응답으로 fallback
export async function processQuery(query) {
  if (!query || query === 'undefined') return '질문이 비어있거나 올바르지 않습니다.';
  
  try {
    const mcpResult = await fetchFromMCP(query);
    if (mcpResult && mcpResult !== 'undefined' && mcpResult.trim() !== '') {
      return mcpResult;
    }
  } catch (e) {
    console.error("쿼리 처리 중 오류:", e);
  }
  
  // MCP 실패 시 기본 응답 제공
  return generateDemoResponse(query);
} 