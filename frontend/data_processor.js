/**
 * OpenManager AI - 데이터 처리기
 * 서버 데이터 처리, 페이지네이션, 필터링 및 UI 업데이트 로직을 구현합니다.
 */

import { AIProcessor } from './ai_processor.js';
import { processQuery } from './process_query.js';
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
            
            // 데모 모드 관련 속성 추가
            this.isDemoMode = this.checkDemoMode() || CONFIG.USE_DEMO_MODE;
            this.demoRefreshInterval = 5000; // 5초마다 데모 데이터 갱신 (서버는 15초마다 시나리오 변경)
            this.demoTimer = null;
            this.virtualTimeScale = 4; // 실제 시간의 4배 속도로 가상 시간 진행
            this.demoTimeStart = Date.now();
            this.scenarioHistory = []; // 데모 시나리오 히스토리 저장
            
            // 초기 데이터 로드
            this.loadData();
            
            // 서버 상태 판단 통합 로직을 전역 함수로 등록
            window.getServerStatus = (server) => this.getServerStatus(server);
            
            // DataProcessor 초기화 완료 이벤트 발생
            this.dispatchReadyEvent();
            
            // 데모 모드가 활성화되면 데모 타이머 시작
            if (this.isDemoMode) {
                console.log('[DEMO] 데모 모드가 활성화되었습니다. 시나리오 기반 데이터를 표시합니다.');
                this.startDemoTimer();
            }
            
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
            
            // 오류 발생 시 자동으로 데모 모드 활성화
            this.isDemoMode = true;
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
        return urlParams.get('demo') === 'true' || urlParams.get('nocache') === 'true' || CONFIG.USE_DEMO_MODE === true;
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
            // 실제 API 호출 시도
            const realApiAvailable = false;
            if (realApiAvailable) {
                const res = await fetch(CONFIG.API_BASE_URL + '/demo/metrics');
                if (res.ok) {
                    const data = await res.json();
                    const arr = Object.values(data);
                    this.processDemoData(arr);
                    this.handleDataUpdate(arr);
                    return;
                }
            }
            
            // API 호출 실패 시 로컬 데이터 생성
            console.log('로컬 데모 데이터 생성');
            const mockData = this.generateMockData();
            this.processDemoData(mockData);
            this.handleDataUpdate(mockData);
            
            // 시나리오 히스토리에 추가 (최대 30개 유지)
            this.scenarioHistory.push({
                timestamp: new Date().toISOString(),
                data: [...mockData]
            });
            
            if (this.scenarioHistory.length > 30) {
                this.scenarioHistory.shift();
            }
            
        } catch (e) {
            console.error('데모 데이터 로드 실패:', e);
            this.generateBasicMockData();
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
    
    // 수정된 loadData 메서드
    async loadData() {
        // 데모 모드일 경우 데모 데이터 로드
        if (this.isDemoMode) {
            this.loadDemoData();
            return;
        }
        
        this.showLoading();
        try {
            const res = await fetch(CONFIG.API_BASE_URL + '/servers/metrics');
            if (!res.ok) throw new Error('서버 데이터 로드 실패');
            const data = await res.json();
            const arr = Object.values(data);
            this.handleDataUpdate(arr);
        } catch (e) {
            console.error('데이터 로드 실패:', e);
            
            // 서버 그리드에 오류 메시지 표시
            const serverList = document.getElementById('serverListContainer');
            if (serverList) {
                serverList.innerHTML = `
                    <div class="p-4 text-center">
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            서버 데이터를 불러오지 못했습니다.
                            <button class="btn btn-sm btn-outline-primary ms-3" onclick="window.dataProcessor.useFallbackData()">
                                <i class="fas fa-sync-alt me-1"></i> 데모 데이터 사용
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // 폴백 데이터 자동 사용
            if (CONFIG.FALLBACK_ENABLED) {
                this.useFallbackData();
            } else {
                this.hideLoading();
            }
        }
    }
    
    // 강화된 폴백 데이터 사용 함수
    useFallbackData() {
        console.log('폴백 데이터를 사용합니다.');
        
        // 미리 저장된 샘플 데이터 사용
        const fallbackData = [
            {
                hostname: 'web-server-01',
                status: 'critical',
                ip: '192.168.1.100',
                cpu: 95,
                memory: 75,
                disk: 65,
                errors: ["MySQL 서비스 연결 실패 (10:32:15)", "CPU 사용량 90% 초과 (10:30:05)"],
                services: {
                    'nginx': 'running',
                    'mysql': 'stopped',
                    'redis': 'running'
                },
                incident: '서버 연결 실패'
            },
            {
                hostname: 'app-server-03',
                status: 'warning',
                ip: '192.168.1.103',
                cpu: 65,
                memory: 82,
                disk: 55,
                errors: ["메모리 누수 감지 (15분 전)"],
                services: {
                    'nginx': 'running',
                    'tomcat': 'running',
                    'redis': 'running'
                },
                incident: '메모리 누수 감지'
            },
            {
                hostname: 'db-server-02',
                status: 'critical',
                ip: '192.168.1.102',
                cpu: 88,
                memory: 70,
                disk: 92,
                errors: ["MySQL 서비스 중단 (5분 전)"],
                services: {
                    'mysql': 'stopped',
                    'postgresql': 'running'
                },
                incident: 'MySQL 서비스 중단'
            }
        ];
        
        // 데이터 형식 변환 - 기존 API와 호환되도록
        const processedData = fallbackData.map(server => ({
            hostname: server.hostname,
            status: server.status,
            ip: server.ip,
            cpu: server.cpu,
            memory: server.memory,
            disk: server.disk,
            errors: server.errors,
            services: server.services,
            incident: server.errors && server.errors.length > 0 ? server.errors[0] : 'Normal'
        }));
        
        this.serverData = processedData;
        this.filteredData = processedData;
        this.renderServerGrid();
        this.hideLoading();
        
        // 사용자에게 폴백 데이터 사용 중임을 알림
        this.showAlert('연결 실패로 데모 데이터를 표시합니다.', 'info');
        
        // 데모 모드 활성화
        this.isDemoMode = true;
        this.startDemoTimer();
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
            const res = await fetch(CONFIG.API_BASE_URL + '/servers/metrics');
            if (!res.ok) throw new Error('서버 데이터 새로고침 실패');
            const data = await res.json();
            const arr = Object.values(data);
            this.handleDataUpdate(arr);
        } catch (e) {
            console.error('데이터 새로고침 실패:', e);
            this.hideLoading();
            
            // 새로고침 실패 시 자동으로 데모 모드 전환
            if (!this.isDemoMode && CONFIG.FALLBACK_ENABLED) {
                this.showAlert('서버 연결 실패, 데모 모드로 전환합니다.', 'warning');
                this.isDemoMode = true;
                this.startDemoTimer();
            } else {
                this.showAlert('서버 데이터 새로고침 실패.', 'warning');
            }
        }
    }
    
    // 데모용 목업 데이터 생성
    generateMockData() {
        // 현재 시각 기준 가상 시나리오 단계 결정
        const now = Date.now();
        const elapsedTime = now - this.demoTimeStart;
        const scenarioDuration = 15 * 1000; // 15초마다 시나리오 변경
        const scenarioStep = Math.floor((elapsedTime / scenarioDuration) % 4);
        
        // 시나리오: 0=정상, 1=경고, 2=심각, 3=복구
        const scenarios = ['normal', 'warning', 'critical', 'recovery'];
        const currentScenario = scenarios[scenarioStep];
        
        console.log(`[DEMO] 현재 시나리오: ${currentScenario} (${scenarioStep}/4)`);
        
        // 서버 목록
        const servers = [
            { hostname: 'web-server-01', ip: '192.168.1.100', role: 'web' },
            { hostname: 'app-server-01', ip: '192.168.1.101', role: 'app' },
            { hostname: 'db-server-01', ip: '192.168.1.102', role: 'db' },
            { hostname: 'cache-server-01', ip: '192.168.1.103', role: 'cache' },
            { hostname: 'storage-server-01', ip: '192.168.1.104', role: 'storage' }
        ];
        
        // 시나리오별 데이터 생성
        return servers.map(server => {
            let cpu, memory, disk, status, incident;
            
            switch (currentScenario) {
                case 'normal':
                    cpu = Math.floor(30 + Math.random() * 20);
                    memory = Math.floor(20 + Math.random() * 30);
                    disk = Math.floor(40 + Math.random() * 20);
                    status = 'normal';
                    incident = 'Normal';
                    break;
                    
                case 'warning':
                    if (server.role === 'web' || server.role === 'app') {
                        cpu = Math.floor(70 + Math.random() * 15);
                        status = 'warning';
                        incident = 'CPU 사용량 증가 감지';
                    } else {
                        cpu = Math.floor(40 + Math.random() * 30);
                        status = 'normal';
                        incident = 'Normal';
                    }
                    memory = Math.floor(40 + Math.random() * 30);
                    disk = Math.floor(40 + Math.random() * 30);
                    break;
                    
                case 'critical':
                    if (server.role === 'web') {
                        cpu = Math.floor(90 + Math.random() * 10);
                        memory = Math.floor(70 + Math.random() * 20);
                        status = 'critical';
                        incident = 'MySQL 서비스 연결 실패';
                    } else if (server.role === 'db') {
                        cpu = Math.floor(80 + Math.random() * 15);
                        disk = Math.floor(90 + Math.random() * 10);
                        status = 'critical';
                        incident = 'MySQL 서비스 중단';
                    } else if (server.role === 'app') {
                        memory = Math.floor(80 + Math.random() * 15);
                        status = 'warning';
                        incident = '메모리 누수 감지';
                    } else {
                        cpu = Math.floor(50 + Math.random() * 20);
                        memory = Math.floor(50 + Math.random() * 20);
                        disk = Math.floor(50 + Math.random() * 20);
                        status = Math.random() > 0.7 ? 'warning' : 'normal';
                        incident = status === 'warning' ? '간헐적 응답 지연' : 'Normal';
                    }
                    
                    // 기본값 설정
                    if (cpu === undefined) cpu = Math.floor(50 + Math.random() * 20);
                    if (memory === undefined) memory = Math.floor(50 + Math.random() * 20);
                    if (disk === undefined) disk = Math.floor(50 + Math.random() * 20);
                    break;
                    
                case 'recovery':
                    if (server.role === 'web') {
                        cpu = Math.floor(70 + Math.random() * 10);
                        status = 'warning';
                        incident = 'CPU 사용량 감소 중';
                    } else if (server.role === 'db') {
                        cpu = Math.floor(60 + Math.random() * 10);
                        disk = Math.floor(80 + Math.random() * 10);
                        status = 'warning';
                        incident = 'MySQL 서비스 재시작 중';
                    } else {
                        cpu = Math.floor(40 + Math.random() * 20);
                        memory = Math.floor(30 + Math.random() * 30);
                        disk = Math.floor(40 + Math.random() * 20);
                        status = 'normal';
                        incident = 'Normal';
                    }
                    
                    // 기본값 설정
                    if (cpu === undefined) cpu = Math.floor(40 + Math.random() * 20);
                    if (memory === undefined) memory = Math.floor(30 + Math.random() * 30);
                    if (disk === undefined) disk = Math.floor(40 + Math.random() * 20);
                    break;
            }
            
            // 가상 타임스탬프 계산
            const virtualTimestamp = new Date(
                Date.now() + (scenarioStep * scenarioDuration) + 
                (Date.now() - this.demoTimeStart) * this.virtualTimeScale
            ).toISOString();
            
            // 서비스 상태 생성
            const services = {};
            if (server.role === 'web') {
                services.nginx = 'running';
                services.redis = 'running';
                services.mysql = currentScenario === 'critical' ? 'stopped' : 'running';
            } else if (server.role === 'app') {
                services.tomcat = 'running';
                services.nodejs = 'running';
            } else if (server.role === 'db') {
                services.mysql = currentScenario === 'critical' ? 'stopped' : 'running';
                services.postgresql = 'running';
            } else if (server.role === 'cache') {
                services.redis = 'running';
                services.memcached = 'running';
            } else if (server.role === 'storage') {
                services.nfs = 'running';
            }
            
            // 에러 메시지 생성
            const errors = [];
            if (status === 'warning' || status === 'critical') {
                errors.push(incident + ' (' + new Date(virtualTimestamp).toLocaleTimeString() + ')');
            }
            
            return {
                hostname: server.hostname,
                ip: server.ip,
                cpu: cpu,
                memory: memory,
                disk: disk,
                status: status,
                incident: incident,
                virtualTimestamp: virtualTimestamp,
                services: services,
                errors: errors,
                role: server.role
            };
        });
    }
    
    // 가장 기본적인 목업 데이터 생성
    generateBasicMockData() {
        const basicData = [
            {
                hostname: 'server-fallback-01',
                status: 'critical',
                ip: '192.168.1.101',
                cpu: 95,
                memory: 85,
                disk: 65,
                errors: ["서버 연결 실패"],
                services: {
                    'nginx': 'running',
                    'mysql': 'stopped'
                },
                incident: '서버 연결 실패'
            }
        ];
        
        this.serverData = basicData;
        this.filteredData = basicData;
        this.renderServerGrid();
        this.hideLoading();
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
        this.mcpUrl = CONFIG.MCP_SERVER_URL; // CONFIG에서 설정 가져오기
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
