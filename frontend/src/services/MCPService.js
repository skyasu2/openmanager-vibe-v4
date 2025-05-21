import axios from 'axios';

// MCP 서버 URL 설정
const MCP_URL = process.env.REACT_APP_MCP_URL || 'https://mcp-server.onrender.com';

/**
 * MCP 서버 관련 서비스
 */
class MCPService {
  /**
   * 자연어 질의를 통해 서버 정보 분석
   * @param {string} query - 자연어 질의 문자열
   * @returns {Promise<Object>} - MCP 응답 객체
   */
  async processQuery(query) {
    try {
      const response = await axios.post(`${MCP_URL}/query`, { query });
      return response.data;
    } catch (error) {
      console.error('MCP 서버 질의 처리 실패:', error);
      throw error;
    }
  }
  
  /**
   * 개발용 Mock 응답 생성
   * @param {string} query - 자연어 질의 문자열
   * @returns {Object} - Mock 응답 객체
   */
  getMockResponse(query) {
    // 현재 날짜
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formattedDate = yesterday.toISOString().split('T')[0];
    
    // 다양한 질문에 대한 Mock 응답
    if (query.includes('장애') || query.includes('문제')) {
      return {
        answer: `${formattedDate} 기준으로 총 3건의 장애가 발생했습니다. 그 중 critical 수준은 1건, warning 수준은 2건이었습니다. 가장 심각한 장애는 데이터베이스 서버(db-01)에서 발생한 CPU 과부하 문제였으며, 현재는 정상화되었습니다.`,
        related_servers: ['db-01', 'app-02', 'web-02'],
        suggestions: ['해당 서버의 상세 로그 확인', 'CPU 사용량 모니터링 설정', '부하 분산 검토'],
        status_summary: {
          critical: 1,
          warning: 2,
          normal: 27
        },
        timestamp: new Date().toISOString()
      };
    } else if (query.includes('상태') || query.includes('현황')) {
      return {
        answer: `현재 총 30대의 서버 중 28대가 정상 작동 중입니다. 경고 상태의 서버는 1대(app-03), 심각 상태의 서버는 1대(db-01)입니다. 모든 웹 서버는 정상 작동 중이며, CPU 평균 사용률은 45%, 메모리 평균 사용률은 52%입니다.`,
        related_servers: ['app-03', 'db-01'],
        suggestions: ['리소스 사용량 확인', '자동 스케일링 설정 검토'],
        status_summary: {
          critical: 1,
          warning: 1,
          normal: 28
        },
        timestamp: new Date().toISOString()
      };
    } else if (query.includes('성능') || query.includes('리소스')) {
      return {
        answer: `현재 시스템의 전반적인 성능은 양호합니다. 다만, db-01 서버의 CPU 사용률이 92%로 높은 상태이며, app-03 서버의 디스크 사용량이 92%로 조치가 필요합니다. 지난 24시간 동안 평균 응답 시간은 250ms로 정상 범위 내에 있습니다.`,
        related_servers: ['db-01', 'app-03'],
        suggestions: ['db-01 서버 CPU 사용량 최적화', 'app-03 서버 디스크 정리'],
        charts: {
          cpu_trend: 'url_to_chart_image',
          memory_trend: 'url_to_chart_image'
        },
        timestamp: new Date().toISOString()
      };
    } else if (query.includes('로그') || query.includes('이벤트')) {
      return {
        answer: `지난 24시간 동안 총 128개의 로그 이벤트가 기록되었습니다. 그 중 에러는 12건, 경고는 35건, 정보성 메시지는 81건이었습니다. 가장 많이 발생한 에러는 "Connection timeout" (5건)이었으며, web-02 서버에서 주로 발생했습니다.`,
        related_servers: ['web-02', 'app-01'],
        top_errors: [
          'Connection timeout (5건)',
          'Database query failed (3건)',
          'Out of memory (2건)'
        ],
        timestamp: new Date().toISOString()
      };
    } else {
      // 기본 응답
      return {
        answer: `질문에 대한 명확한 답변을 드리기 어렵습니다. 서버 상태, 장애 현황, 성능 정보 등에 대해 물어보시면 더 자세한 정보를 제공해 드릴 수 있습니다.`,
        suggestions: ['서버 상태 확인하기', '최근 장애 확인하기', '리소스 사용량 보기'],
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 싱글톤 인스턴스 생성하여 내보내기
export default new MCPService(); 