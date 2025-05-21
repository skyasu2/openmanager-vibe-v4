// process_query.js - 개선된 쿼리 처리 모듈
import { CONFIG } from './config.js';

/**
 * MCP 서버에 쿼리 전송 및 응답 처리
 * @param {string} query - 사용자 질문
 * @param {string} context - 컨텍스트 유형 (기본값: "server-status")
 * @returns {Promise<string>} - 서버 응답
 */
async function fetchFromMCP(query, context = "server-status") {
  try {
    // 데모 모드 검사
    if (CONFIG.USE_DEMO_MODE) {
      console.log("데모 모드에서 AI 응답 생성");
      return generateDemoResponse(query);
    }
    
    // 백엔드 서버 엔드포인트 결정 (개선된 API 사용)
    const endpoint = CONFIG.USE_ENHANCED_API 
      ? `${CONFIG.API_BASE_URL}/ai/query` 
      : CONFIG.MCP_SERVER_URL;
    
    // 요청 데이터 준비
    const requestData = CONFIG.USE_ENHANCED_API 
      ? { 
          userId: localStorage.getItem('userId') || 'user_' + Date.now(),
          question: query
        }
      : { 
          query: query, 
          context: context 
        };
    
    // 서버 요청
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });

    // 응답 검증
    if (!response.ok) {
      throw new Error(`MCP 서버 오류 (${response.status}): ${response.statusText}`);
    }

    // 응답 파싱
    const data = await response.json();
    
    // 응답 형식에 따른 결과 추출
    const result = CONFIG.USE_ENHANCED_API 
      ? data.answer 
      : (data.result || "MCP 응답이 없습니다.");
    
    return result;
  } catch (error) {
    console.error("MCP 요청 실패:", error);
    // 오류 발생 시 로컬 응답 생성
    return generateDemoResponse(query);
  }
}

/**
 * 백엔드에 쿼리 분석 요청 (NLU 처리)
 * @param {string} query - 사용자 질문
 * @returns {Promise<Object>} - 인텐트 및 엔티티 분석 결과
 */
async function analyzeQuery(query) {
  try {
    // 데모 모드 또는 향상된 API가 비활성화된 경우 로컬 처리
    if (CONFIG.USE_DEMO_MODE || !CONFIG.USE_ENHANCED_API) {
      return performLocalQueryAnalysis(query);
    }
    
    // 백엔드 NLU 분석 활용
    const response = await fetch(`${CONFIG.API_BASE_URL}/ai/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: query })
    });

    if (!response.ok) {
      throw new Error("NLU 분석 요청 실패");
    }

    return await response.json();
  } catch (error) {
    console.error("쿼리 분석 오류:", error);
    // 백업으로 로컬 분석 사용
    return performLocalQueryAnalysis(query);
  }
}

/**
 * 로컬에서 기본적인 쿼리 분석 수행 (백엔드 분석 사용 불가 시)
 * @param {string} query - 사용자 질문
 * @returns {Object} - 경량 NLU 구조 기반 분석 결과 (인텐트 + 엔티티)
 */
function performLocalQueryAnalysis(query) {
  const normalizedQuery = query.toLowerCase();
  
  // 인텐트 (의도) 인식 개선 - 백엔드의 INTENTS와 유사한 구조 사용
  let intent = "SERVER_STATUS"; // 기본 인텐트
  
  // 인텐트 패턴 정의 (백엔드와 유사한 구조)
  const INTENTS = {
    CPU_STATUS: { 
      patterns: [/cpu.*높|많|상태|사용|부하/i],
      description: 'CPU 상태 및 사용률 조회'
    },
    MEMORY_STATUS: { 
      patterns: [/메모리.*누수|증가|많|상태|사용/i, /ram|램/i],
      description: '메모리 상태 및 사용률 조회'
    },
    DISK_STATUS: { 
      patterns: [/디스크.*부족|상태|사용|용량|저장|공간/i],
      description: '디스크 상태 및 사용률 조회'
    },
    INCIDENT_QUERY: { 
      patterns: [/장애.*많|이벤트.*많|문제|오류|에러/i], 
      description: '장애 및 이벤트 정보 조회'
    },
    RECOMMENDATION: { 
      patterns: [/권장|추천|방법|해결|조치/i], 
      description: '문제 해결 방법 추천'
    },
    HELP: { 
      patterns: [/도움|헬프|help|명령/i], 
      description: '도움말 및 사용 방법'
    }
  };
  
  // 인텐트 매칭 로직
  for (const [intentName, intentObj] of Object.entries(INTENTS)) {
    for (const pattern of intentObj.patterns) {
      if (pattern.test(normalizedQuery)) {
        intent = intentName;
        break;
      }
    }
    if (intent !== "SERVER_STATUS") break; // 인텐트가 발견되면 루프 종료
  }
  
  // 엔티티 (개체) 추출 - 백엔드와 유사한 방식
  const entities = {};
  
  // 서버 유형 엔티티 (web, db, app 등)
  const SERVER_TYPE_PATTERNS = {
    'web': [/웹|web/i],
    'db': [/db|데이터베이스|database/i],
    'app': [/app|애플리케이션|application/i],
    'cache': [/cache|캐시|redis/i],
    'storage': [/storage|저장|스토리지/i]
  };
  
  for (const [entityType, patterns] of Object.entries(SERVER_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        entities.server_type = entityType;
        break;
      }
    }
    if (entities.server_type) break;
  }
  
  // 임계값 엔티티 (숫자 + % 형태)
  const thresholdMatch = normalizedQuery.match(/(\d+)(%|\s*퍼센트)/);
  if (thresholdMatch) {
    entities.threshold = parseInt(thresholdMatch[1]);
  }
  
  // 시간 범위 엔티티
  const TIME_RANGE_PATTERNS = {
    'recent': [/최근|recent/i],
    'today': [/오늘|today/i],
    'week': [/주간|일주일|week/i],
    'month': [/월간|한달|month/i]
  };
  
  for (const [timeRange, patterns] of Object.entries(TIME_RANGE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        entities.time_range = timeRange;
        break;
      }
    }
    if (entities.time_range) break;
  }
  
  // 심각도 엔티티
  const SEVERITY_PATTERNS = {
    'critical': [/심각|critical/i],
    'warning': [/경고|warning/i],
    'normal': [/정상|normal/i]
  };
  
  for (const [severity, patterns] of Object.entries(SEVERITY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        entities.severity = severity;
        break;
      }
    }
    if (entities.severity) break;
  }
  
  return {
    original_query: query,
    intent: intent,
    entities: entities,
    confidence: 0.7
  };
}

/**
 * 데모 모드에서 사용할 로컬 응답 생성
 * @param {string} query - 사용자 질문 
 * @returns {string} - 질문에 대한 샘플 응답
 */
function generateDemoResponse(query) {
  query = query.toLowerCase();
  
  // 간단한 키워드 매칭 기반 응답
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
  
  if (query.includes('해결') || query.includes('조치') || query.includes('방법')) {
    return "1. CPU 과부하 문제:\n- 불필요한 프로세스 종료 (top 명령어로 확인)\n- 작업 부하 분산 또는 스케일 아웃 검토\n- 리소스 사용량이 많은 애플리케이션 최적화\n\n2. 메모리 부족 문제:\n- 애플리케이션 재시작으로 메모리 누수 해소\n- 메모리 사용량 많은 프로세스 확인\n- 메모리 한도 설정 및 스왑 공간 확인";
  }
  
  return "질문을 이해하지 못했습니다. 서버 상태, CPU 사용률, 메모리 누수, 디스크 공간, 장애 이력 등에 대해 물어보세요.";
}

/**
 * 통합 쿼리 처리 함수
 * 1. 쿼리 분석 (로컬 또는 백엔드)
 * 2. 결과 생성 (MCP 또는 로컬)
 * 3. 결과 후처리 및 시각화 힌트 추가
 */
export async function processQuery(query) {
  if (!query || query === 'undefined') {
    return '질문이 비어있거나 올바르지 않습니다.';
  }
  
  try {
    // 1. 쿼리 분석 (선택적)
    let queryAnalysis = null;
    if (CONFIG.USE_ENHANCED_API && !CONFIG.USE_DEMO_MODE) {
      queryAnalysis = await analyzeQuery(query);
      console.log("쿼리 분석 결과:", queryAnalysis);
    }
    
    // 2. MCP 서버에 쿼리 전송 또는 데모 응답 생성
    const mcpResult = await fetchFromMCP(query);
    
    // 3. 응답이 유효한지 확인
    if (mcpResult && mcpResult !== 'undefined' && mcpResult.trim() !== '') {
      // 4. 응답 후처리 및 메타데이터 추가 (필요한 경우)
      const enhancedResult = enhanceResponse(mcpResult, queryAnalysis);
      return enhancedResult;
    }
  } catch (error) {
    console.error("쿼리 처리 중 오류:", error);
  }
  
  // 5. 위 과정 실패 시 기본 응답 제공
  return generateDemoResponse(query);
}

/**
 * 응답 개선 및 메타데이터 추가
 * @param {string} response - 원본 응답
 * @param {Object} queryAnalysis - 쿼리 분석 결과
 * @returns {string} - 개선된 응답
 */
function enhanceResponse(response, queryAnalysis) {
  if (!queryAnalysis) return response;
  
  // 간단한 개선 - 인텐트에 따라 특정 서식 추가
  let enhancedResponse = response;
  
  // 인텐트별 응답 개선
  switch (queryAnalysis.intent) {
    case 'RECOMMENDATION':
      // 권장사항인 경우 번호 매기기 추가
      if (!response.includes('\n1.')) {
        enhancedResponse = response
          .replace(/(\d+\.\s*[^:\n]+):/, '$1:\n')
          .replace(/(\d+\.\s*[^:\n]+)\n/, '$1:\n');
      }
      break;
      
    case 'INCIDENT_QUERY':
      // 장애 정보에 가시성 추가
      enhancedResponse = response.replace(
        /(주요 이벤트:.*)/,
        '---\n$1\n---'
      );
      break;
  }
  
  return enhancedResponse;
} 