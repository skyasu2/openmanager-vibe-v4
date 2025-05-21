import EventBus from '../services/EventBus.js';
import AIService from '../services/AIService.js';

export default class AIProcessor {
  constructor() {
    this.currentContext = {};
    this.lastQuery = '';
    
    // DOM 요소 참조
    this.elements = {
      queryInput: document.getElementById('ai-query-input'),
      queryButton: document.getElementById('ai-query-btn'),
      responseArea: document.getElementById('ai-response'),
      suggestionsList: document.getElementById('query-suggestions')
    };
    
    // 이벤트 리스너 설정
    this.initEventListeners();
    
    // 이벤트 구독
    this.subscribeToEvents();
    
    // 샘플 쿼리 제안 초기화
    this.initQuerySuggestions();
  }
  
  initEventListeners() {
    // 쿼리 제출 버튼 클릭 이벤트
    this.elements.queryButton.addEventListener('click', () => {
      this.submitQuery();
    });
    
    // 쿼리 입력 엔터 키 이벤트
    this.elements.queryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.submitQuery();
      }
    });
  }
  
  subscribeToEvents() {
    // 서버 선택 이벤트 구독
    EventBus.subscribe('server:selected', this.updateContext.bind(this));
    
    // 필터 변경 이벤트 구독
    EventBus.subscribe('filter:changed', this.updateContext.bind(this));
    
    // 컨텍스트 업데이트 이벤트 구독
    EventBus.subscribe('context:updated', this.updateContext.bind(this));
  }
  
  updateContext(data) {
    this.currentContext = {
      ...this.currentContext,
      ...data
    };
    
    // 컨텍스트에 따른 쿼리 제안 업데이트
    this.updateQuerySuggestions();
  }
  
  async submitQuery() {
    const query = this.elements.queryInput.value.trim();
    
    if (!query) return;
    
    this.lastQuery = query;
    
    try {
      // 로딩 상태 표시
      this.showQueryLoading(true);
      
      // AI 서비스에 쿼리 전송
      const response = await AIService.submitQuery(query, this.currentContext);
      
      // 응답 이벤트 발행
      EventBus.publish('ai:response-received', response);
      
      // 입력 필드 초기화
      this.elements.queryInput.value = '';
      
    } catch (error) {
      EventBus.publish('error', {
        source: 'ai-processor',
        message: '쿼리 처리 중 오류가 발생했습니다.',
        details: error.message
      });
    } finally {
      this.showQueryLoading(false);
    }
  }
  
  showQueryLoading(isLoading) {
    this.elements.queryButton.disabled = isLoading;
    this.elements.queryButton.innerHTML = isLoading ? 
      '<span class="spinner"></span>' : '질문하기';
  }
  
  initQuerySuggestions() {
    const suggestions = [
      'CPU 사용률이 높은 서버는?',
      '메모리 사용량이 90% 이상인 서버는?',
      '디스크 공간이 부족한 서버가 있나요?',
      '최근 장애가 발생한 서버는?',
      '서버 상태 요약해줘'
    ];
    
    this.renderSuggestions(suggestions);
  }
  
  updateQuerySuggestions() {
    let suggestions = [];
    
    // 선택된 서버가 있는 경우
    if (this.currentContext.selectedServer) {
      const serverName = this.currentContext.selectedServer.hostname;
      suggestions = [
        `${serverName}의 현재 상태는?`,
        `${serverName}의 CPU 사용률 추이는?`,
        `${serverName}에서 실행 중인 서비스는?`,
        `${serverName}의 성능 개선 방법은?`
      ];
    } 
    // 특정 상태 필터가 적용된 경우
    else if (this.currentContext.filterStatus && this.currentContext.filterStatus !== 'all') {
      const status = this.currentContext.filterStatus;
      suggestions = [
        `${status} 상태인 서버의 주요 문제점은?`,
        `${status} 상태 서버 중 가장 심각한 것은?`,
        `${status} 상태를 개선하기 위한 조치는?`
      ];
    }
    // 기본 제안
    else {
      suggestions = [
        'CPU 사용률이 높은 서버는?',
        '메모리 사용량이 90% 이상인 서버는?',
        '디스크 공간이 부족한 서버가 있나요?',
        '최근 장애가 발생한 서버는?',
        '서버 상태 요약해줘'
      ];
    }
    
    this.renderSuggestions(suggestions);
  }
  
  renderSuggestions(suggestions) {
    if (!this.elements.suggestionsList) return;
    
    this.elements.suggestionsList.innerHTML = '';
    
    suggestions.forEach(suggestion => {
      const item = document.createElement('li');
      item.className = 'suggestion-item';
      item.textContent = suggestion;
      
      item.addEventListener('click', () => {
        this.elements.queryInput.value = suggestion;
        this.submitQuery();
      });
      
      this.elements.suggestionsList.appendChild(item);
    });
  }
}

// AI 프로세서 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.aiProcessor = new AIProcessor();
}); 