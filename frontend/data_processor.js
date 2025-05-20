/**
 * OpenManager AI - 데이터 처리기
 * 서버 데이터 처리, 페이지네이션, 필터링 및 UI 업데이트 로직을 구현합니다.
 */

import { AIProcessor, processQuery } from './ai_processor.js';
import { CONFIG } from './config.js';

class DataProcessor {
    constructor() {
        try {
            // 기본 데이터 초기화
            this.serverData = window.serverData || [];
            this.filteredData = [];
            this.currentFilter = 'all';
            this.currentSort = 'status-critical'; // 기본 정렬을 상태 기준(심각 > 경고 > 정상)으로 변경
            this.searchQuery = '';
            this.currentPage = 1;
            this.itemsPerPage = 6; // 페이지당 서버 수
            
            // AI 문제 페이지네이션
            this.currentProblemPage = 1;
            this.problemsPerPage = 5; // 페이지당, 처음에 표시될 문제 수
            
            // 로딩 상태 관리
            this.isLoading = false;
            this.cardLoadingStates = {}; // 서버 ID별 로딩 상태를 추적
            
            // 초기화 로깅
            console.log('DataProcessor 초기화 시작...');
            
            // AIProcessor 인스턴스 초기화 개선
            if (window.aiProcessor) {
                this.aiProcessor = window.aiProcessor;
                console.log('기존 AIProcessor 인스턴스를 사용합니다.');
            } else if (typeof AIProcessor === 'function') {
                // AIProcessor 클래스가 존재하면 인스턴스 생성
                try {
                    window.aiProcessor = new AIProcessor();
                    this.aiProcessor = window.aiProcessor;
                    console.log("AIProcessor 인스턴스를 새로 생성했습니다.");
                } catch (e) {
                    console.error("AIProcessor 인스턴스 생성 중 오류 발생:", e);
                    this.aiProcessor = null;
                }
            } else {
                console.warn("AIProcessor 클래스를 찾을 수 없습니다. 기본 상태 판단 로직을 사용합니다.");
                this.aiProcessor = null;
            }
            
            // 서버 상태 평가 임계값 - 통합 관리
            this.thresholds = {
                critical: {
                    cpu: 90,
                    memory: 90,
                    disk: 90
                },
                warning: {
                    cpu: 70,
                    memory: 70,
                    disk: 70
                }
            };
            
            // UI 요소 참조 - 안전하게 참조를 시도합니다
            this.findUIElements();
            
            // 이벤트 리스너 등록
            if (this.hasRequiredElements()) {
                this.registerEventListeners();
                console.log('이벤트 리스너가 등록되었습니다.');
            } else {
                console.warn('일부 UI 요소를 찾을 수 없어 이벤트 리스너 등록이 제한됩니다.');
            }
            
            // 자동 데이터 업데이트 (1분 간격)
            setInterval(() => this.refreshData(), 60 * 1000);
            
            // 초기 데이터 로드
            this.loadData();
            
            // 서버 상태 판단 통합 로직을 전역 함수로 등록
            window.getServerStatus = (server) => this.getServerStatus(server);
            
            // DataProcessor 초기화 완료 이벤트 발생
            this.dispatchReadyEvent();
            
            console.log('DataProcessor 초기화 완료.');
        } catch (error) {
            console.error('DataProcessor 초기화 중 심각한 오류 발생:', error);
            
            // 최소한의 기능 보장
            this.serverData = window.serverData || [];
            this.filteredData = window.serverData || [];
            
            // 기본 필수 함수들은 최소한으로라도 구현
            if (!this.showLoading) {
                this.showLoading = function() {
                    this.updateLoadingStatus(true);
                    this.updateQueryInputStatus(true);
                };
            }
            
            if (!this.hideLoading) {
                this.hideLoading = function() {
                    this.updateLoadingStatus(false);
                    this.updateQueryInputStatus(false);
                };
            }
            
            // 기본 데이터 처리 함수
            if (!this.handleDataUpdate) {
                this.handleDataUpdate = function(data) {
                    this.serverData = data || [];
                    this.filteredData = data || [];
                    this.renderServerGrid();
                    this.hideLoading();
                };
            }
        }
        
        // 데모 모드 관련 속성 추가
        this.isDemoMode = this.checkDemoMode();
        this.demoRefreshInterval = 5000; // 5초마다 데모 데이터 갱신 (서버는 15초마다 시나리오 변경)
        this.demoTimer = null;
        this.virtualTimeScale = 4; // 실제 시간의 4배 속도로 가상 시간 진행
        this.demoTimeStart = Date.now();
        this.scenarioHistory = []; // 데모 시나리오 히스토리 저장
        
        // 데모 모드면 데모 타이머 시작
        if (this.isDemoMode) {
            console.log('[DEMO] 데모 모드가 활성화되었습니다. 시나리오 기반 데이터를 표시합니다.');
            this.startDemoTimer();
        }
    }
    
    // DataProcessor 준비 완료 이벤트 발생
    dispatchReadyEvent() {
        const readyEvent = new CustomEvent('dataProcessorReady', {
            detail: this
        });
        document.dispatchEvent(readyEvent);
    }
    
    // URL에서 데모 모드 여부 확인
    checkDemoMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('demo') === 'true';
    }
    
    // 데모 모드 타이머 시작
    startDemoTimer() {
        // 기존 타이머가 있으면 정리
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
        }
        
        // 초기 데모 데이터 로드
        this.loadDemoData();
        
        // 주기적으로 데모 데이터 갱신
        this.demoTimer = setInterval(() => {
            this.loadDemoData();
        }, this.demoRefreshInterval);
    }
    
    // 데모 모드 타이머 정지
    stopDemoTimer() {
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
        }
    }
    
    // 데모 데이터 로드
    async loadDemoData() {
        try {
            const res = await fetch('/api/demo/metrics');
            if (!res.ok) throw new Error('데모 데이터 로드 실패');
            
            const data = await res.json();
            const arr = Object.values(data);
            
            // 데모 데이터 처리 및 가상 타임스탬프 적용
            this.processDemoData(arr);
            
            // 데모 데이터 업데이트
            this.handleDataUpdate(arr);
            
            // 시나리오 히스토리에 추가 (최대 30개 유지)
            this.scenarioHistory.push({
                timestamp: new Date().toISOString(),
                data: [...arr]
            });
            
            if (this.scenarioHistory.length > 30) {
                this.scenarioHistory.shift();
            }
            
        } catch (e) {
            console.error('[DEMO] 데모 데이터 로드 오류:', e);
            this.showAlert('데모 데이터를 불러오지 못했습니다.', 'danger');
        }
    }
    
    // 데모 데이터 처리 (가상 시간 등 적용)
    processDemoData(data) {
        // 현재 가상 시간 계산 (실제 경과 시간의 4배)
        const elapsedTime = Date.now() - this.demoTimeStart;
        const virtualElapsed = elapsedTime * this.virtualTimeScale;
        
        // 데모 시나리오 라벨 업데이트
        const scenarioTypes = data.map(server => server.status);
        const criticalCount = scenarioTypes.filter(s => s === 'critical').length;
        const warningCount = scenarioTypes.filter(s => s === 'warning').length;
        
        let scenarioLabel = '정상';
        if (criticalCount > 0) {
            scenarioLabel = '심각';
        } else if (warningCount > 0) {
            scenarioLabel = '경고';
        }
        
        // 데모 모드 상태 표시
        const statusIndicator = document.getElementById('demo-status');
        if (statusIndicator) {
            statusIndicator.innerText = `[데모] 현재 시나리오: ${scenarioLabel}`;
            statusIndicator.className = 'alert ' + 
                (scenarioLabel === '심각' ? 'alert-danger' : 
                 scenarioLabel === '경고' ? 'alert-warning' : 'alert-success');
        } else {
            // 데모 상태 표시 요소가 없으면 생성
            const statusDiv = document.createElement('div');
            statusDiv.id = 'demo-status';
            statusDiv.innerText = `[데모] 현재 시나리오: ${scenarioLabel}`;
            statusDiv.className = 'alert ' + 
                (scenarioLabel === '심각' ? 'alert-danger' : 
                 scenarioLabel === '경고' ? 'alert-warning' : 'alert-success');
            statusDiv.style.position = 'fixed';
            statusDiv.style.top = '10px';
            statusDiv.style.right = '10px';
            statusDiv.style.zIndex = '1000';
            document.body.appendChild(statusDiv);
        }
    }
    
    // 로딩 상태 관리 업데이트 함수
    updateLoadingStatus(isLoading, serverId = null) {
        this.isLoading = isLoading;
        
        // 특정 서버 카드만 로딩 처리
        if (serverId) {
            this.cardLoadingStates[serverId] = isLoading;
            this.updateServerCardLoading(serverId, isLoading);
            return;
        }
        
        // 전체 로딩 인디케이터 대신 각 서버 카드에 로딩 상태 표시
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            // 전역 로딩은 더 이상 사용하지 않음
            loadingIndicator.style.display = 'none';
        }
        
        // 모든 서버 카드에 로딩 상태 적용
        const serverItems = document.querySelectorAll('.server-item');
        serverItems.forEach(item => {
            if (item && item.id) {
                this.cardLoadingStates[item.id] = isLoading;
                this.updateServerCardLoading(item.id, isLoading);
            }
        });
        
        // 최근 장애 서버 카드에도 로딩 상태 적용
        const alertCards = document.querySelectorAll('.alert-card');
        alertCards.forEach(card => {
            if (isLoading) {
                card.classList.add('pulse-animation');
            } else {
                card.classList.remove('pulse-animation');
            }
        });
    }
    
    // 서버 카드 로딩 상태 업데이트
    updateServerCardLoading(serverId, isLoading) {
        const serverCard = document.getElementById(serverId);
        if (!serverCard) return;

        const loadingIndicator = serverCard.querySelector('.card-loading-indicator');
        
        if (isLoading) {
            serverCard.classList.add('server-card-loading');
            
            // 로딩 표시자가 없으면 새로 생성
            if (!loadingIndicator) {
                const indicator = document.createElement('div');
                indicator.className = 'card-loading-indicator';
                indicator.innerHTML = `
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span>분석 중...</span>
                `;
                serverCard.appendChild(indicator);
            } else {
                loadingIndicator.style.display = 'flex';
            }
        } else {
            serverCard.classList.remove('server-card-loading');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }
    
    // 질문 입력 상태 업데이트
    updateQueryInputStatus(isLoading) {
        const queryBtn = document.getElementById('aiQueryBtn');
        const queryInput = document.getElementById('aiQuery');
        const queryExamples = document.querySelectorAll('.query-example');
        const statusMessage = document.getElementById('queryStatusMessage');
        
        if (queryBtn && queryInput) {
            queryBtn.disabled = isLoading;
            queryInput.disabled = isLoading;
            
            // 질문 예시 버튼도 비활성화
            queryExamples.forEach(btn => {
                btn.disabled = isLoading;
                if (isLoading) {
                    btn.classList.add('opacity-50');
                } else {
                    btn.classList.remove('opacity-50');
                }
            });
            
            // 상태 메시지 표시/숨김
            if (statusMessage) {
                if (isLoading) {
                    statusMessage.style.display = 'block';
                } else {
                    statusMessage.style.display = 'none';
                }
            }
        }
    }
    
    // 기존 loadData 메서드 수정
    async loadData() {
        // 데모 모드일 경우 데모 데이터 로드
        if (this.isDemoMode) {
            this.loadDemoData();
            return;
        }
        
        this.showLoading();
        try {
            const res = await fetch('/api/servers/metrics');
            if (!res.ok) throw new Error('서버 데이터 로드 실패');
            const data = await res.json();
            const arr = Object.values(data);
            this.handleDataUpdate(arr);
        } catch (e) {
            console.error('데이터 로드 실패:', e);
            this.hideLoading();
            
            // 서버 그리드에 오류 메시지 표시
            const serverList = document.getElementById('serverListContainer');
            if (serverList) {
                serverList.innerHTML = `
                    <div class="p-4 text-center">
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            서버 데이터를 불러오지 못했습니다.
                            <button class="btn btn-sm btn-outline-primary ms-3" onclick="window.location.reload()">
                                <i class="fas fa-sync-alt me-1"></i> 새로고침
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // 폴백 데이터 사용 (미리 저장된 샘플 데이터)
            this.useFallbackData();
        }
    }
    
    // 폴백 데이터 사용 함수
    useFallbackData() {
        // 미리 저장된 샘플 데이터 사용
        const fallbackData = [
            {
                hostname: 'server-fallback-01',
                status: 'warning',
                ip: '192.168.1.101',
                cpu_usage: 75,
                memory_usage_percent: 68,
                disk: [{ disk_usage_percent: 65 }],
                errors: ["서버 연결 실패"],
                services: {
                    'nginx': 'running',
                    'mysql': 'stopped'
                }
            }
        ];
        
        this.serverData = fallbackData;
        this.filteredData = fallbackData;
        this.renderServerGrid();
        
        // 사용자에게 폴백 데이터 사용 중임을 알림
        this.showAlert('연결 실패로 오프라인 데이터를 표시합니다.', 'warning');
    }
    
    // 기존 refreshData 메서드 수정
    async refreshData() {
        // 데모 모드일 경우 데모 데이터 갱신
        if (this.isDemoMode) {
            this.loadDemoData();
            return;
        }
        
        // 부분 로딩만 표시 (UI 차단 없음)
        const partialLoading = true;
        if (partialLoading) {
            // 각 카드별 로딩만 표시
            this.updateLoadingStatus(true);
        } else {
            this.showLoading();
        }
        
        try {
            const res = await fetch('/api/servers/metrics');
            if (!res.ok) throw new Error('서버 데이터 새로고침 실패');
            const data = await res.json();
            const arr = Object.values(data);
            this.handleDataUpdate(arr);
        } catch (e) {
            console.error('데이터 새로고침 실패:', e);
            this.hideLoading();
            
            // 새로고침 실패 시 상태 표시줄에 경고 메시지
            this.showAlert('서버 데이터 새로고침 실패. 연결을 확인해 주세요.', 'warning');
        }
    }
    
    // 경고 메시지 표시 유틸리티 함수
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // 메시지 컨테이너가 있으면 사용, 없으면 body에 추가
        const container = document.querySelector('.alert-container') || document.body;
        container.appendChild(alertDiv);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }
    
    // 데모 히스토리 데이터 가져오기 (그래프 등에 사용)
    getDemoHistory() {
        return this.scenarioHistory;
    }
    
    // 기존 메서드들...
}

// 데이터 프로세서 인스턴스 생성
window.addEventListener('DOMContentLoaded', () => {
    if (!window.aiProcessor) window.aiProcessor = new AIProcessor();
    new MCPQueryManager();
});

// MCP 질문/응답 확장 기능 추가
class MCPQueryManager {
    constructor() {
        this.historyKey = 'mcpQueryHistory';
        this.history = this.loadHistory();
        this.context = null;
        this.mcpUrl = 'https://openmanager-vibe-v4.onrender.com/query'; // 실제 MCP 서버 주소로 교체
        this.init();
    }

    async init() {
        await this.loadContext();
        this.initUI();
        this.renderHistory();
    }

    async loadContext() {
        try {
            const res = await fetch('/public/context/server-status.txt');
            this.context = await res.text();
        } catch (e) {
            this.context = '';
        }
    }

    initUI() {
        const input = document.getElementById('queryInput');
        const button = document.getElementById('ai-query-submit');
        const result = document.getElementById('queryResultContent');
        const resultBox = document.getElementById('queryResult');
        const loading = document.getElementById('queryLoading');
        const closeBtn = document.getElementById('closeQueryResult');
        const exampleBtns = document.querySelectorAll('.example-query-btn');

        if (input && button) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleQuery(input, result, resultBox, loading);
            });
            button.addEventListener('click', () => this.handleQuery(input, result, resultBox, loading));
        }
        if (closeBtn && resultBox) {
            closeBtn.addEventListener('click', () => {
                resultBox.classList.remove('active');
                resultBox.style.display = 'none';
            });
        }
        if (exampleBtns) {
            exampleBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    input.value = btn.textContent;
                    this.handleQuery(input, result, resultBox, loading);
                });
            });
        }
    }

    async handleQuery(input, result, resultBox, loading) {
        const query = input.value?.trim();
        if (!query || query === 'undefined') return; // 빈 입력 방지
        loading.style.display = 'block';
        resultBox.classList.remove('active');
        resultBox.style.display = 'none';
        try {
            const answer = await processQuery(query);
            if (!answer || answer === 'undefined' || answer.trim() === '') {
                result.innerHTML = '적절한 답변을 찾지 못했습니다.';
            } else {
                result.innerHTML = window.marked ? window.marked.parse(answer) : answer;
            }
            resultBox.classList.add('active');
            resultBox.style.display = 'block';
            this.addHistory(query, answer);
            this.renderHistory();
        } catch (e) {
            result.innerHTML = '질문 처리 중 오류가 발생했습니다.';
            resultBox.classList.add('active');
            resultBox.style.display = 'block';
        } finally {
            loading.style.display = 'none';
            input.value = '';
        }
    }

    addHistory(query, answer) {
        this.history.unshift({ query, answer, ts: new Date().toISOString() });
        if (this.history.length > 30) this.history.pop();
        localStorage.setItem(this.historyKey, JSON.stringify(this.history));
    }

    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.historyKey)) || [];
        } catch {
            return [];
        }
    }

    renderHistory() {
        const histBox = document.getElementById('queryHistory');
        if (!histBox) return;
        histBox.innerHTML = this.history.map(item => `
            <div class="query-item">
                <div class="query-question"><i class="fas fa-user"></i> <span>${item.query}</span></div>
                <div class="query-answer markdown-content">${window.marked ? window.marked.parse(item.answer) : item.answer}</div>
                <div class="query-timestamp">${new Date(item.ts).toLocaleString()}</div>
            </div>
        `).join('');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MCPQueryManager();
});
