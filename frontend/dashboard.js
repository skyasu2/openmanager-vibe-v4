/**
 * OpenManager AI - 대시보드 UI 컨트롤러
 * 서버 대시보드의 UI 인터랙션과 시각화를 처리합니다.
 */

// 서버 섹션으로 스크롤 함수
window.scrollToServer = function(serverId) {
    const element = document.getElementById(serverId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        
        // 스크롤 후 서버 상세 정보 열기
        setTimeout(() => {
            const details = element.querySelector('.server-details');
            const toggleBtn = element.querySelector('.toggle-details');
            const icon = toggleBtn.querySelector('i');
            
            if (!details.classList.contains('active')) {
                details.classList.add('active');
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                
                // 차트 초기화
                if (!details.hasAttribute('data-initialized')) {
                    initializeCharts(details);
                    details.setAttribute('data-initialized', 'true');
                }
            }
        }, 500);
    }
}

// AI 질문 처리 함수
window.processAIQuery = function() {
    const query = document.getElementById('aiQuery').value.trim();
    if (!query) return;
    
    const responseDiv = document.getElementById('aiResponse');
    const responseContent = document.getElementById('aiResponseContent');
    const reportDownload = document.getElementById('reportDownload');
    
    // 로딩 상태 표시
    responseDiv.style.display = 'block';
    responseContent.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            <span>분석 중입니다...</span>
        </div>
    `;
    
    // 실제로는 서버에 API 요청을 보내지만, 여기서는 예시 응답으로 대체
    setTimeout(() => {
        responseContent.innerHTML = `
            <p>쿼리: "${query}"에 대한 분석 결과입니다.</p>
            
            <p><span class="keyword keyword-cause">주요 문제점:</span></p>
            <ul>
                <li>web-server-01의 MySQL 서비스가 다운되어 있습니다.</li>
                <li>app-server-03에서 메모리 누수가 감지되었습니다.</li>
            </ul>
            
            <p><span class="keyword keyword-impact">영향 분석:</span></p>
            <p>사용자 로그인 요청 처리 속도가 평균 60% 느려졌으며, 일부 API 요청에 타임아웃이 발생하고 있습니다.</p>
            
            <p><span class="keyword keyword-action">권장 조치:</span></p>
            <ul>
                <li>MySQL 서비스 재시작 및 로그 확인</li>
                <li>app-server-03의 Java 애플리케이션 힙 메모리 조정</li>
                <li>부하 분산을 위한 임시 서버 추가 검토</li>
            </ul>
        `;
        
        // 보고서 다운로드 버튼 표시
        reportDownload.style.display = 'block';
    }, 2000);
}

// 차트 초기화 함수
function initializeCharts(detailsElement) {
    // CPU 차트
    const cpuCanvas = detailsElement.querySelector('.cpu-chart');
    if (cpuCanvas) {
        new Chart(cpuCanvas, {
            type: 'line',
            data: {
                labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'],
                datasets: [{
                    label: 'CPU 사용량 (%)',
                    data: [45, 52, 60, 75, 82, 90, 95],
                    backgroundColor: 'rgba(234, 74, 59, 0.2)',
                    borderColor: 'rgba(234, 74, 59, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // 메모리 차트
    const memoryCanvas = detailsElement.querySelector('.memory-chart');
    if (memoryCanvas) {
        new Chart(memoryCanvas, {
            type: 'line',
            data: {
                labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'],
                datasets: [{
                    label: '메모리 사용량 (%)',
                    data: [60, 62, 65, 68, 72, 75, 75],
                    backgroundColor: 'rgba(246, 194, 62, 0.2)',
                    borderColor: 'rgba(246, 194, 62, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // 디스크 차트
    const diskCanvas = detailsElement.querySelector('.disk-chart');
    if (diskCanvas) {
        new Chart(diskCanvas, {
            type: 'line',
            data: {
                labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'],
                datasets: [{
                    label: '디스크 사용량 (%)',
                    data: [72, 72, 73, 73, 74, 75, 75],
                    backgroundColor: 'rgba(28, 200, 138, 0.2)',
                    borderColor: 'rgba(28, 200, 138, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// 문서 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 서버 토글 기능
    const toggleButtons = document.querySelectorAll('.toggle-details');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const serverItem = this.closest('.server-item');
            const details = serverItem.querySelector('.server-details');
            const icon = this.querySelector('i');
            
            if (details.classList.contains('active')) {
                details.classList.remove('active');
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            } else {
                details.classList.add('active');
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                
                // 차트 초기화 (details에 data-initialized 속성이 없을 때만)
                if (!details.hasAttribute('data-initialized')) {
                    initializeCharts(details);
                    details.setAttribute('data-initialized', 'true');
                }
            }
        });
    });
    
    // 서버 요약 클릭시 상세 정보 토글
    const serverSummaries = document.querySelectorAll('.server-summary');
    serverSummaries.forEach(summary => {
        summary.addEventListener('click', function() {
            const toggleBtn = this.querySelector('.toggle-details');
            toggleBtn.click();
        });
    });
    
    // 질문 예시 클릭 기능
    const queryExamples = document.querySelectorAll('.query-example');
    queryExamples.forEach(example => {
        example.addEventListener('click', function() {
            document.getElementById('aiQuery').value = this.textContent;
        });
    });
    
    // AI 질문 처리
    document.getElementById('aiQueryBtn').addEventListener('click', window.processAIQuery);
    document.getElementById('aiQuery').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.processAIQuery();
        }
    });
    
    // 데모 모드 토글
    document.getElementById('demoModeToggle').addEventListener('click', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const isDemoMode = urlParams.get('demo') === 'true';
        
        if (isDemoMode) {
            window.location.href = window.location.pathname;
        } else {
            window.location.href = window.location.pathname + '?demo=true';
        }
    });
    
    // 필터 버튼 활성화 토글
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // 여기에 실제 필터링 로직 추가
        });
    });
}); 