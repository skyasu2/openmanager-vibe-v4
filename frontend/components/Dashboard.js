import EventBus from '../services/EventBus.js';
import ServerDataService from '../services/ServerDataService.js';
import AIService from '../services/AIService.js';

export default class Dashboard {
  constructor() {
    this.servers = [];
    this.selectedServer = null;
    this.filterStatus = 'all';
    this.isLoading = false;
    
    // DOM 요소 참조
    this.elements = {
      serverList: document.getElementById('server-list'),
      summarySection: document.getElementById('status-summary'),
      filterButtons: document.querySelectorAll('.filter-btn'),
      queryInput: document.getElementById('ai-query-input'),
      queryButton: document.getElementById('ai-query-btn'),
      responseArea: document.getElementById('ai-response')
    };
    
    // 이벤트 리스너 등록
    this.initEventListeners();
    
    // 이벤트 구독
    this.subscribeToEvents();
    
    // 초기 데이터 로드
    this.loadDashboardData();
  }
  
  initEventListeners() {
    // 필터 버튼 이벤트 설정
    this.elements.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const status = e.target.dataset.status;
        this.setFilterStatus(status);
      });
    });
    
    // AI 쿼리 제출 이벤트
    this.elements.queryButton.addEventListener('click', () => {
      const query = this.elements.queryInput.value.trim();
      if (query) {
        this.submitQuery(query);
      }
    });
  }
  
  subscribeToEvents() {
    // 서버 데이터 업데이트 이벤트
    EventBus.subscribe('servers:data-updated', this.handleServersUpdate.bind(this));
    
    // 서버 선택 이벤트
    EventBus.subscribe('server:selected', this.handleServerSelection.bind(this));
    
    // AI 응답 이벤트
    EventBus.subscribe('ai:response-received', this.handleAIResponse.bind(this));
    
    // 오류 이벤트
    EventBus.subscribe('error', this.handleError.bind(this));
  }
  
  async loadDashboardData() {
    try {
      this.showLoading(true);
      const servers = await ServerDataService.getServers();
      EventBus.publish('servers:data-updated', servers);
    } catch (error) {
      EventBus.publish('error', {
        source: 'dashboard',
        message: '서버 데이터를 불러오는 중 오류가 발생했습니다.',
        details: error.message
      });
    } finally {
      this.showLoading(false);
    }
  }
  
  handleServersUpdate(servers) {
    this.servers = servers;
    this.renderDashboard();
  }
  
  handleServerSelection(server) {
    this.selectedServer = server;
    this.highlightSelectedServer();
    
    // 서버 컨텍스트 업데이트
    EventBus.publish('context:updated', {
      selectedServer: server
    });
  }
  
  handleAIResponse(response) {
    this.renderAIResponse(response);
    
    // 응답에 관련 서버가 있다면 하이라이트
    if (response.related_servers && response.related_servers.length > 0) {
      this.highlightRelatedServers(response.related_servers);
    }
  }
  
  setFilterStatus(status) {
    this.filterStatus = status;
    
    // 필터 버튼 UI 업데이트
    this.elements.filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });
    
    this.renderServerList();
    
    // 필터 변경 이벤트 발행
    EventBus.publish('filter:changed', { status });
  }
  
  renderDashboard() {
    this.renderServerList();
    this.renderSummary();
  }
  
  renderServerList() {
    const filteredServers = this.filterServers();
    const list = this.elements.serverList;
    list.innerHTML = '';
    
    filteredServers.forEach(server => {
      const card = document.createElement('div');
      card.className = `server-card status-${server.status}`;
      card.dataset.id = server.id;
      if (this.selectedServer && this.selectedServer.id === server.id) {
        card.classList.add('selected');
      }
      
      card.innerHTML = `
        <div class="server-name">${server.hostname}</div>
        <div class="server-metrics">
          <div class="metric">
            <span class="label">CPU</span>
            <div class="progress-bar">
              <div class="progress" style="width: ${server.cpu}%"></div>
            </div>
            <span class="value">${server.cpu}%</span>
          </div>
          <div class="metric">
            <span class="label">Memory</span>
            <div class="progress-bar">
              <div class="progress" style="width: ${server.memory}%"></div>
            </div>
            <span class="value">${server.memory}%</span>
          </div>
          <div class="metric">
            <span class="label">Disk</span>
            <div class="progress-bar">
              <div class="progress" style="width: ${server.disk}%"></div>
            </div>
            <span class="value">${server.disk}%</span>
          </div>
        </div>
      `;
      
      card.addEventListener('click', () => {
        EventBus.publish('server:selected', server);
      });
      
      list.appendChild(card);
    });
  }
  
  renderSummary() {
    const counts = {
      total: this.servers.length,
      critical: this.servers.filter(s => s.status === 'critical').length,
      warning: this.servers.filter(s => s.status === 'warning').length,
      normal: this.servers.filter(s => s.status === 'normal').length
    };
    
    this.elements.summarySection.innerHTML = `
      <div class="summary-item">
        <span class="count">${counts.total}</span>
        <span class="label">Total</span>
      </div>
      <div class="summary-item status-normal">
        <span class="count">${counts.normal}</span>
        <span class="label">Normal</span>
      </div>
      <div class="summary-item status-warning">
        <span class="count">${counts.warning}</span>
        <span class="label">Warning</span>
      </div>
      <div class="summary-item status-critical">
        <span class="count">${counts.critical}</span>
        <span class="label">Critical</span>
      </div>
    `;
  }
  
  filterServers() {
    if (this.filterStatus === 'all') {
      return this.servers;
    }
    return this.servers.filter(server => server.status === this.filterStatus);
  }
  
  highlightSelectedServer() {
    const serverCards = this.elements.serverList.querySelectorAll('.server-card');
    serverCards.forEach(card => {
      card.classList.remove('selected');
    });
    
    if (this.selectedServer) {
      const selectedCard = this.elements.serverList.querySelector(
        `.server-card[data-id="${this.selectedServer.id}"]`
      );
      if (selectedCard) {
        selectedCard.classList.add('selected');
      }
    }
  }
  
  highlightRelatedServers(serverIds) {
    const serverCards = this.elements.serverList.querySelectorAll('.server-card');
    serverCards.forEach(card => {
      const serverId = card.dataset.id;
      if (serverIds.includes(serverId)) {
        card.classList.add('related');
      } else {
        card.classList.remove('related');
      }
    });
  }
  
  async submitQuery(query) {
    try {
      this.showQueryLoading(true);
      
      // AI 쿼리 실행
      const context = {
        selectedServer: this.selectedServer,
        filterStatus: this.filterStatus
      };
      
      const response = await AIService.submitQuery(query, context);
      
      // 응답 이벤트 발행
      EventBus.publish('ai:response-received', response);
    } catch (error) {
      EventBus.publish('error', {
        source: 'ai-query',
        message: '쿼리 처리 중 오류가 발생했습니다.',
        details: error.message
      });
    } finally {
      this.showQueryLoading(false);
    }
  }
  
  renderAIResponse(response) {
    const responseArea = this.elements.responseArea;
    
    // 응답 내용 설정
    responseArea.innerHTML = `
      <div class="response-content">${response.answer}</div>
      ${response.visualization_type ? 
        `<div id="visualization" class="visualization ${response.visualization_type}"></div>` : ''}
    `;
    
    // 시각화 타입이 있는 경우 차트 렌더링
    if (response.visualization_type) {
      // 여기서 차트 렌더링 로직 추가 예정
      // 나중에 ChartManager 컴포넌트로 분리
    }
  }
  
  showLoading(isLoading) {
    this.isLoading = isLoading;
    document.body.classList.toggle('loading', isLoading);
  }
  
  showQueryLoading(isLoading) {
    this.elements.queryButton.disabled = isLoading;
    this.elements.queryButton.innerHTML = isLoading ? 
      '<span class="spinner"></span>' : '질문하기';
  }
  
  handleError(error) {
    console.error(`Error (${error.source}):`, error.message);
    
    // 오류 Toast 또는 알림 표시
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
      <div class="toast-title">오류</div>
      <div class="toast-message">${error.message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // 3초 후 토스트 제거
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // 주기적 데이터 새로고침 설정
  startAutoRefresh(intervalMs = 30000) {
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, intervalMs);
  }
  
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// 대시보드 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
  window.dashboard.startAutoRefresh();
}); 