// frontend/demoMode.js
// 데모 모드 관리 및 시나리오 기반 데이터 처리

class DemoManager {
    constructor() {
        this.isDemoMode = this.checkDemoMode();
        this.demoRefreshInterval = 5000; // 5초마다 데모 데이터 갱신 (서버는 15초마다 시나리오 변경)
        this.demoTimer = null;
        this.virtualTimeScale = 4; // 실제 시간의 4배 속도로 가상 시간 진행
        this.demoTimeStart = Date.now();
        this.scenarioHistory = []; // 데모 시나리오 히스토리 저장
        this.dataProcessor = null; // DataProcessor 인스턴스 참조
        
        // 데모 모드 UI 요소 표시
        if (this.isDemoMode) {
            this.initDemoUI();
        }
    }
    
    // DataProcessor 참조 설정
    setDataProcessor(dataProcessor) {
        this.dataProcessor = dataProcessor;
    }
    
    // URL에서 데모 모드 여부 확인
    checkDemoMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('demo') === 'true';
    }
    
    // 데모 모드 UI 초기화
    initDemoUI() {
        // 데모 상태 표시 컨테이너
        const statusDiv = document.createElement('div');
        statusDiv.id = 'demo-status';
        statusDiv.className = 'alert alert-info';
        statusDiv.innerHTML = '<strong>[데모 모드]</strong> 시나리오를 불러오는 중...';
        statusDiv.style.position = 'fixed';
        statusDiv.style.top = '10px';
        statusDiv.style.right = '10px';
        statusDiv.style.zIndex = '1000';
        statusDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        document.body.appendChild(statusDiv);
        
        // 데모 컨트롤 패널
        const controlPanel = document.createElement('div');
        controlPanel.id = 'demo-controls';
        controlPanel.style.position = 'fixed';
        controlPanel.style.bottom = '10px';
        controlPanel.style.right = '10px';
        controlPanel.style.zIndex = '1000';
        controlPanel.style.backgroundColor = '#f8f9fa';
        controlPanel.style.padding = '10px';
        controlPanel.style.borderRadius = '5px';
        controlPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        controlPanel.innerHTML = `
            <div class="d-flex flex-column">
                <div class="mb-2">
                    <span class="badge bg-primary" id="demo-virtual-time">가상 시간: 로딩 중...</span>
                </div>
                <div class="mb-2">
                    <span class="badge bg-secondary" id="demo-scenario-step">시나리오: 초기화 중...</span>
                </div>
                <div class="btn-group btn-group-sm">
                    <button id="btn-demo-pause" class="btn btn-outline-secondary">일시정지</button>
                    <button id="btn-demo-resume" class="btn btn-outline-primary" disabled>재개</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(controlPanel);
        
        // 버튼 이벤트 리스너
        document.getElementById('btn-demo-pause').addEventListener('click', () => {
            this.pauseDemo();
        });
        
        document.getElementById('btn-demo-resume').addEventListener('click', () => {
            this.resumeDemo();
        });
        
        console.log('[DEMO] 데모 모드 UI가 초기화되었습니다.');
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
        
        // UI 버튼 상태 업데이트
        const pauseBtn = document.getElementById('btn-demo-pause');
        const resumeBtn = document.getElementById('btn-demo-resume');
        
        if (pauseBtn && resumeBtn) {
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
        }
        
        console.log('[DEMO] 데모 타이머가 시작되었습니다.');
    }
    
    // 데모 모드 타이머 일시정지
    pauseDemo() {
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
            
            // UI 버튼 상태 업데이트
            const pauseBtn = document.getElementById('btn-demo-pause');
            const resumeBtn = document.getElementById('btn-demo-resume');
            
            if (pauseBtn && resumeBtn) {
                pauseBtn.disabled = true;
                resumeBtn.disabled = false;
            }
            
            console.log('[DEMO] 데모 타이머가 일시정지되었습니다.');
        }
    }
    
    // 데모 모드 타이머 재개
    resumeDemo() {
        this.startDemoTimer();
        console.log('[DEMO] 데모 타이머가 재개되었습니다.');
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
            
            // 데모 데이터를 DataProcessor에 전달
            if (this.dataProcessor) {
                this.dataProcessor.handleDataUpdate(arr);
            } else {
                // 전역 window.serverData에 직접 설정 (기존 코드 호환성)
                window.serverData = arr;
                // 서버 데이터 업데이트 이벤트 발생
                const updateEvent = new CustomEvent('serverDataUpdated');
                document.dispatchEvent(updateEvent);
            }
            
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
        if (!data || data.length === 0) return;
        
        // 현재 시나리오 파악
        const scenarioTypes = data.map(server => server.status);
        const criticalCount = scenarioTypes.filter(s => s === 'critical').length;
        const warningCount = scenarioTypes.filter(s => s === 'warning').length;
        
        let scenarioLabel = '정상';
        let alertClass = 'alert-success';
        
        if (criticalCount > 0) {
            scenarioLabel = '심각';
            alertClass = 'alert-danger';
        } else if (warningCount > 0) {
            scenarioLabel = '경고';
            alertClass = 'alert-warning';
        }
        
        // 가상 시간 업데이트 (첫 번째 서버의 virtualTimestamp 사용)
        const virtualTime = data[0]?.virtualTimestamp ? 
            new Date(data[0].virtualTimestamp) : new Date();
        
        // UI 업데이트
        this.updateDemoUI(scenarioLabel, alertClass, virtualTime);
    }
    
    // 데모 UI 업데이트
    updateDemoUI(scenarioLabel, alertClass, virtualTime) {
        // 상태 표시 업데이트
        const statusIndicator = document.getElementById('demo-status');
        if (statusIndicator) {
            statusIndicator.innerText = `[데모] 현재 시나리오: ${scenarioLabel}`;
            // 기존 alert 클래스 제거 후 새로운 클래스 추가
            statusIndicator.className = 'alert';
            statusIndicator.classList.add(alertClass);
        }
        
        // 가상 시간 업데이트
        const timeIndicator = document.getElementById('demo-virtual-time');
        if (timeIndicator) {
            timeIndicator.innerText = `가상 시간: ${virtualTime.toLocaleString()}`;
        }
        
        // 시나리오 단계 업데이트
        const scenarioIndicator = document.getElementById('demo-scenario-step');
        if (scenarioIndicator) {
            scenarioIndicator.innerText = `시나리오: ${scenarioLabel}`;
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
            alertDiv.remove();
        }, 3000);
    }
    
    // 데모 히스토리 데이터 가져오기 (그래프 등에 사용)
    getScenarioHistory() {
        return this.scenarioHistory;
    }
}

// 전역 인스턴스 생성 및 내보내기
const demoManager = new DemoManager();
export default demoManager;