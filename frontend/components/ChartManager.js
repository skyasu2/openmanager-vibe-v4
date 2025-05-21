import EventBus from '../services/EventBus.js';

export default class ChartManager {
  constructor() {
    // 차트 객체 저장소
    this.charts = {};
    
    // 차트 렌더링 대상 요소
    this.elements = {
      summaryCharts: document.getElementById('summary-charts'),
      serverDetailCharts: document.getElementById('server-detail-charts'),
      aiVisualization: document.getElementById('visualization')
    };
    
    // 이벤트 구독
    this.subscribeToEvents();
    
    // 차트 라이브러리 초기화
    this.initChartLibrary();
  }
  
  subscribeToEvents() {
    // 서버 데이터 업데이트 이벤트
    EventBus.subscribe('servers:data-updated', this.updateServerCharts.bind(this));
    
    // AI 응답 이벤트
    EventBus.subscribe('ai:response-received', this.handleAIVisualization.bind(this));
    
    // 서버 선택 이벤트
    EventBus.subscribe('server:selected', this.showServerDetailCharts.bind(this));
  }
  
  initChartLibrary() {
    // Chart.js 또는 다른 차트 라이브러리 설정
    // 예: 글로벌 옵션 설정, 테마 등
    if (window.Chart) {
      Chart.defaults.font.family = "'Noto Sans', 'Helvetica', sans-serif";
      Chart.defaults.color = '#555';
      Chart.defaults.responsive = true;
      Chart.defaults.maintainAspectRatio = false;
    }
  }
  
  updateServerCharts(serversData) {
    // 서버 요약 차트 생성/업데이트
    this.renderStatusDistributionChart(serversData);
    this.renderResourceUtilizationChart(serversData);
  }
  
  handleAIVisualization(response) {
    const visualizationType = response.visualization_type;
    if (!visualizationType || !this.elements.aiVisualization) return;
    
    // 이전 차트 정리
    if (this.charts.aiChart) {
      this.charts.aiChart.destroy();
    }
    
    // 시각화 타입에 따른 차트 렌더링
    switch (visualizationType) {
      case 'cpu_chart':
        this.renderCPUChart(response.related_servers, response.data);
        break;
      case 'memory_chart':
        this.renderMemoryChart(response.related_servers, response.data);
        break;
      case 'disk_chart':
        this.renderDiskChart(response.related_servers, response.data);
        break;
      case 'status_summary':
        this.renderStatusSummaryChart(response.data);
        break;
      case 'incident_timeline':
        this.renderIncidentTimeline(response.data);
        break;
      case 'recommendation':
        // 권장사항은 특별한 시각화 없음
        this.elements.aiVisualization.innerHTML = '';
        break;
      default:
        this.elements.aiVisualization.innerHTML = '<div class="no-visualization">No visualization available</div>';
    }
  }
  
  showServerDetailCharts(server) {
    if (!this.elements.serverDetailCharts) return;
    
    // 이전 차트 정리
    if (this.charts.serverDetailChart) {
      this.charts.serverDetailChart.destroy();
    }
    
    // 서버 상세 컨테이너 준비
    this.elements.serverDetailCharts.innerHTML = `
      <div class="chart-container">
        <canvas id="server-history-chart"></canvas>
      </div>
    `;
    
    // 서버 메트릭 히스토리 차트 생성
    this.renderServerHistoryChart(server);
  }
  
  // 상태 분포 차트 (파이/도넛 차트)
  renderStatusDistributionChart(serversData) {
    if (!this.elements.summaryCharts) return;
    
    // 서버 상태별 카운트 계산
    const statusCount = {
      normal: 0,
      warning: 0,
      critical: 0
    };
    
    serversData.forEach(server => {
      statusCount[server.status] = (statusCount[server.status] || 0) + 1;
    });
    
    // 차트 준비
    if (!document.getElementById('status-chart')) {
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.innerHTML = '<canvas id="status-chart"></canvas>';
      this.elements.summaryCharts.appendChild(chartContainer);
    }
    
    // 차트 생성/업데이트
    const ctx = document.getElementById('status-chart').getContext('2d');
    
    if (this.charts.statusChart) {
      this.charts.statusChart.data.datasets[0].data = [
        statusCount.normal,
        statusCount.warning,
        statusCount.critical
      ];
      this.charts.statusChart.update();
    } else {
      this.charts.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Normal', 'Warning', 'Critical'],
          datasets: [{
            data: [statusCount.normal, statusCount.warning, statusCount.critical],
            backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
            borderWidth: 1
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Server Status Distribution'
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }
  
  // 리소스 사용량 차트 (바 차트)
  renderResourceUtilizationChart(serversData) {
    if (!this.elements.summaryCharts) return;
    
    // 평균 리소스 사용량 계산
    let totalCPU = 0, totalMemory = 0, totalDisk = 0;
    serversData.forEach(server => {
      totalCPU += server.cpu || 0;
      totalMemory += server.memory || 0;
      totalDisk += server.disk || 0;
    });
    
    const avgCPU = serversData.length ? (totalCPU / serversData.length).toFixed(1) : 0;
    const avgMemory = serversData.length ? (totalMemory / serversData.length).toFixed(1) : 0;
    const avgDisk = serversData.length ? (totalDisk / serversData.length).toFixed(1) : 0;
    
    // 차트 준비
    if (!document.getElementById('resource-chart')) {
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.innerHTML = '<canvas id="resource-chart"></canvas>';
      this.elements.summaryCharts.appendChild(chartContainer);
    }
    
    // 차트 생성/업데이트
    const ctx = document.getElementById('resource-chart').getContext('2d');
    
    if (this.charts.resourceChart) {
      this.charts.resourceChart.data.datasets[0].data = [avgCPU, avgMemory, avgDisk];
      this.charts.resourceChart.update();
    } else {
      this.charts.resourceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['CPU', 'Memory', 'Disk'],
          datasets: [{
            label: 'Average Usage (%)',
            data: [avgCPU, avgMemory, avgDisk],
            backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 159, 64, 0.7)'],
            borderColor: ['rgb(54, 162, 235)', 'rgb(75, 192, 192)', 'rgb(255, 159, 64)'],
            borderWidth: 1
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Average Resource Utilization'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
    }
  }
  
  // 서버 히스토리 차트 (라인 차트)
  renderServerHistoryChart(server) {
    // 실제 구현에서는 이 서버의 시계열 데이터를 가져와야 함
    // 현재는 더미 데이터 사용
    const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
    const cpuData = Array.from({length: 24}, () => Math.floor(Math.random() * 40) + server.cpu - 20);
    const memoryData = Array.from({length: 24}, () => Math.floor(Math.random() * 40) + server.memory - 20);
    const diskData = Array.from({length: 24}, () => Math.floor(Math.random() * 10) + server.disk - 5);
    
    const ctx = document.getElementById('server-history-chart').getContext('2d');
    this.charts.serverDetailChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'CPU Usage',
            data: cpuData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Memory Usage',
            data: memoryData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Disk Usage',
            data: diskData,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `${server.hostname} - 24-Hour Resource History`
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }
  
  // AI 응답용 특수 차트들
  
  renderCPUChart(servers, data) {
    this.renderMetricBarChart('CPU Usage', servers, 'cpu', '#36a2eb');
  }
  
  renderMemoryChart(servers, data) {
    this.renderMetricBarChart('Memory Usage', servers, 'memory', '#4bc0c0');
  }
  
  renderDiskChart(servers, data) {
    this.renderMetricBarChart('Disk Usage', servers, 'disk', '#ff9f40');
  }
  
  renderMetricBarChart(title, servers, metricKey, color) {
    if (!servers || !servers.length) return;
    
    const serverData = window.dashboard.servers.filter(s => 
      servers.includes(s.hostname) || servers.includes(s.id)
    );
    
    if (!serverData.length) return;
    
    const labels = serverData.map(s => s.hostname);
    const data = serverData.map(s => s[metricKey] || 0);
    
    const ctx = this.elements.aiVisualization;
    ctx.innerHTML = '<canvas id="ai-metric-chart"></canvas>';
    const chartCanvas = document.getElementById('ai-metric-chart');
    
    this.charts.aiChart = new Chart(chartCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: title,
          data: data,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: title
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }
  
  renderStatusSummaryChart(data) {
    // statusCount와 같은 데이터 예상
    if (!data) {
      // 전체 서버 상태 카운트 계산
      const servers = window.dashboard?.servers || [];
      data = {
        total: servers.length,
        normal: servers.filter(s => s.status === 'normal').length,
        warning: servers.filter(s => s.status === 'warning').length,
        critical: servers.filter(s => s.status === 'critical').length
      };
    }
    
    const ctx = this.elements.aiVisualization;
    ctx.innerHTML = '<canvas id="ai-status-chart"></canvas>';
    const chartCanvas = document.getElementById('ai-status-chart');
    
    this.charts.aiChart = new Chart(chartCanvas.getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['Normal', 'Warning', 'Critical'],
        datasets: [{
          data: [data.normal, data.warning, data.critical],
          backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Server Status Summary'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  }
  
  renderIncidentTimeline(data) {
    // 이 경우 특별한 타임라인 시각화 필요
    // 현재는 간단한 HTML로 대체
    this.elements.aiVisualization.innerHTML = `
      <div class="incident-timeline">
        <h3>Recent Incidents Timeline</h3>
        <div class="timeline">
          ${this.generateIncidentTimelineHTML(data)}
        </div>
      </div>
    `;
  }
  
  generateIncidentTimelineHTML(data) {
    // 데이터가 없는 경우 샘플 데이터 사용
    const incidents = data || [
      { server: 'web-03', time: '1 hour ago', message: 'High CPU usage detected', severity: 'warning' },
      { server: 'db-01', time: '3 hours ago', message: 'Database connection failed', severity: 'critical' },
      { server: 'app-02', time: '1 day ago', message: 'Memory leak detected', severity: 'warning' }
    ];
    
    return incidents.map(incident => `
      <div class="timeline-item severity-${incident.severity || 'warning'}">
        <div class="timeline-time">${incident.time}</div>
        <div class="timeline-content">
          <div class="timeline-server">${incident.server}</div>
          <div class="timeline-message">${incident.message}</div>
        </div>
      </div>
    `).join('');
  }
}

// 차트 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.chartManager = new ChartManager();
}); 