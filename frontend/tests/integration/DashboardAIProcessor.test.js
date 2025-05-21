import Dashboard from '../../components/Dashboard.js';
import AIProcessor from '../../components/AIProcessor.js';
import EventBus from '../../services/EventBus.js';
import ServerDataService from '../../services/ServerDataService.js';
import AIService from '../../services/AIService.js';

// EventBus 실제 구현 사용 (모킹 대신)
jest.unmock('../../services/EventBus.js');

// 다른 의존성 모킹
jest.mock('../../services/ServerDataService.js');
jest.mock('../../services/AIService.js');

describe('Dashboard & AIProcessor Integration', () => {
  let dashboard;
  let aiProcessor;
  
  beforeEach(() => {
    // 가상 DOM 설정
    document.body.innerHTML = `
      <div id="server-list"></div>
      <div id="status-summary"></div>
      <input type="text" id="ai-query-input">
      <button id="ai-query-btn">질문하기</button>
      <div id="ai-response"></div>
      <ul id="query-suggestions"></ul>
    `;
    
    // 서비스 모킹
    ServerDataService.getServers = jest.fn().mockResolvedValue([
      { id: 'server1', hostname: 'web-01', status: 'normal', cpu: 30, memory: 40, disk: 25 },
      { id: 'server2', hostname: 'db-01', status: 'warning', cpu: 75, memory: 60, disk: 45 }
    ]);
    
    AIService.submitQuery = jest.fn().mockResolvedValue({
      answer: '테스트 응답',
      visualization_type: 'cpu_chart',
      related_servers: ['server1']
    });
    
    // 리얼 EventBus 초기화
    Object.keys(EventBus.listeners || {}).forEach(key => {
      delete EventBus.listeners[key];
    });
    
    // 컴포넌트 인스턴스 생성
    dashboard = new Dashboard();
    aiProcessor = new AIProcessor();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should update AI context when server is selected', async () => {
    // 서버 데이터 로드
    await dashboard.loadDashboardData();
    
    // 서버 선택 시뮬레이션
    const selectedServer = { id: 'server1', hostname: 'web-01', status: 'normal', cpu: 30 };
    dashboard.handleServerSelection(selectedServer);
    
    // AIProcessor의 컨텍스트 업데이트 확인
    expect(aiProcessor.currentContext).toHaveProperty('selectedServer');
    expect(aiProcessor.currentContext.selectedServer).toEqual(selectedServer);
  });
  
  test('should update query suggestions when filter changes', () => {
    // 렌더링 메서드 스파이
    jest.spyOn(aiProcessor, 'renderSuggestions');
    
    // 필터 변경
    dashboard.setFilterStatus('warning');
    
    // AIProcessor 상태 확인
    expect(aiProcessor.currentContext).toHaveProperty('filterStatus');
    expect(aiProcessor.currentContext.filterStatus).toBe('warning');
    
    // 제안 렌더링 호출 확인
    expect(aiProcessor.renderSuggestions).toHaveBeenCalled();
  });
  
  test('should process query and publish AI response', async () => {
    // AI 응답 처리 스파이
    jest.spyOn(dashboard, 'handleAIResponse');
    
    // 쿼리 입력 설정
    document.getElementById('ai-query-input').value = '테스트 질문';
    
    // 쿼리 제출
    await aiProcessor.submitQuery();
    
    // AIService 호출 확인
    expect(AIService.submitQuery).toHaveBeenCalledWith('테스트 질문', expect.any(Object));
    
    // Dashboard의 응답 핸들러 호출 확인
    expect(dashboard.handleAIResponse).toHaveBeenCalled();
    expect(dashboard.handleAIResponse).toHaveBeenCalledWith(expect.objectContaining({
      answer: '테스트 응답',
      visualization_type: 'cpu_chart'
    }));
  });
  
  test('should highlight related servers when AI response received', async () => {
    // 서버 데이터 로드
    await dashboard.loadDashboardData();
    
    // 관련 서버 하이라이트 스파이
    jest.spyOn(dashboard, 'highlightRelatedServers');
    
    // AI 응답 처리
    dashboard.handleAIResponse({
      answer: '테스트 응답',
      visualization_type: 'cpu_chart',
      related_servers: ['server1']
    });
    
    // 관련 서버 하이라이트 호출 확인
    expect(dashboard.highlightRelatedServers).toHaveBeenCalledWith(['server1']);
  });
}); 