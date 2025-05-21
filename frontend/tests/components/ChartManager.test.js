import ChartManager from '../../components/ChartManager.js';
import EventBus from '../../services/EventBus.js';

// Chart.js 모킹
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
  data: {
    datasets: [{ data: [] }]
  }
}));

// 의존성 모킹
jest.mock('../../services/EventBus.js');

describe('ChartManager', () => {
  let chartManager;
  
  beforeEach(() => {
    // 가상 DOM 생성
    document.body.innerHTML = `
      <div id="summary-charts"></div>
      <div id="server-detail-charts"></div>
      <div id="visualization"></div>
    `;
    
    // Chart 목업 초기화
    Chart.mockClear();
    
    // ChartManager 인스턴스 생성
    chartManager = new ChartManager();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize correctly', () => {
    // 차트 저장소 초기화 확인
    expect(chartManager.charts).toEqual({});
    
    // DOM 요소 참조 확인
    expect(chartManager.elements.summaryCharts).toBeDefined();
    expect(chartManager.elements.serverDetailCharts).toBeDefined();
    expect(chartManager.elements.aiVisualization).toBeDefined();
    
    // 이벤트 구독 확인
    expect(EventBus.subscribe).toHaveBeenCalledWith('servers:data-updated', expect.any(Function));
    expect(EventBus.subscribe).toHaveBeenCalledWith('ai:response-received', expect.any(Function));
    expect(EventBus.subscribe).toHaveBeenCalledWith('server:selected', expect.any(Function));
  });
  
  test('should update server charts on data update event', () => {
    // 차트 렌더링 메서드 스파이
    jest.spyOn(chartManager, 'renderStatusDistributionChart');
    jest.spyOn(chartManager, 'renderResourceUtilizationChart');
    
    // 테스트 서버 데이터
    const serversData = [
      { id: 'server1', hostname: 'web-01', status: 'normal', cpu: 30, memory: 40, disk: 25 },
      { id: 'server2', hostname: 'db-01', status: 'warning', cpu: 75, memory: 60, disk: 45 }
    ];
    
    // 이벤트 처리 메서드 호출
    chartManager.updateServerCharts(serversData);
    
    // 차트 렌더링 메서드 호출 확인
    expect(chartManager.renderStatusDistributionChart).toHaveBeenCalledWith(serversData);
    expect(chartManager.renderResourceUtilizationChart).toHaveBeenCalledWith(serversData);
  });
  
  test('should render status distribution chart', () => {
    // 테스트 서버 데이터
    const serversData = [
      { id: 'server1', hostname: 'web-01', status: 'normal' },
      { id: 'server2', hostname: 'db-01', status: 'warning' },
      { id: 'server3', hostname: 'app-01', status: 'critical' },
      { id: 'server4', hostname: 'web-02', status: 'normal' }
    ];
    
    // DOM에 차트 캔버스 요소 추가
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = '<canvas id="status-chart"></canvas>';
    chartManager.elements.summaryCharts.appendChild(chartContainer);
    
    // 차트 렌더링
    chartManager.renderStatusDistributionChart(serversData);
    
    // Chart 생성자 호출 확인
    expect(Chart).toHaveBeenCalled();
    expect(Chart.mock.calls[0][1].type).toBe('doughnut');
    expect(Chart.mock.calls[0][1].data.datasets[0].data).toEqual([2, 1, 1]); // normal, warning, critical 카운트
  });
  
  test('should handle AI visualization based on type', () => {
    // 다양한 시각화 타입 테스트
    const visualizationTypes = [
      'cpu_chart', 'memory_chart', 'disk_chart', 
      'status_summary', 'incident_timeline', 'recommendation'
    ];
    
    // 각 시각화 타입별 메서드 스파이
    jest.spyOn(chartManager, 'renderCPUChart').mockImplementation(() => {});
    jest.spyOn(chartManager, 'renderMemoryChart').mockImplementation(() => {});
    jest.spyOn(chartManager, 'renderDiskChart').mockImplementation(() => {});
    jest.spyOn(chartManager, 'renderStatusSummaryChart').mockImplementation(() => {});
    jest.spyOn(chartManager, 'renderIncidentTimeline').mockImplementation(() => {});
    
    // 시각화 타입별 처리 확인
    visualizationTypes.forEach(type => {
      const response = { 
        visualization_type: type,
        related_servers: ['server1'],
        data: {}
      };
      
      chartManager.handleAIVisualization(response);
      
      // 타입에 맞는 렌더링 메서드 호출 확인
      if (type === 'cpu_chart') {
        expect(chartManager.renderCPUChart).toHaveBeenCalled();
      } else if (type === 'memory_chart') {
        expect(chartManager.renderMemoryChart).toHaveBeenCalled();
      } else if (type === 'disk_chart') {
        expect(chartManager.renderDiskChart).toHaveBeenCalled();
      } else if (type === 'status_summary') {
        expect(chartManager.renderStatusSummaryChart).toHaveBeenCalled();
      } else if (type === 'incident_timeline') {
        expect(chartManager.renderIncidentTimeline).toHaveBeenCalled();
      }
      
      // 스파이 초기화
      jest.clearAllMocks();
    });
  });
  
  test('should show server detail charts for selected server', () => {
    // 테스트 서버 데이터
    const selectedServer = { id: 'server1', hostname: 'web-01', cpu: 40, memory: 50, disk: 30 };
    
    // 차트 렌더링 메서드 스파이
    jest.spyOn(chartManager, 'renderServerHistoryChart').mockImplementation(() => {});
    
    // 서버 상세 차트 표시
    chartManager.showServerDetailCharts(selectedServer);
    
    // 서버 히스토리 차트 렌더링 호출 확인
    expect(chartManager.renderServerHistoryChart).toHaveBeenCalledWith(selectedServer);
    
    // DOM 업데이트 확인
    expect(chartManager.elements.serverDetailCharts.innerHTML).toContain('chart-container');
    expect(chartManager.elements.serverDetailCharts.innerHTML).toContain('server-history-chart');
  });
}); 