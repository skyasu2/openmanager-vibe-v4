// 실제 프로덕션에서 바로 사용 가능한 어댑터 패턴
export class DataSourceAdapter {
  constructor(config) {
    this.config = config;
    this.dataSource = this.initializeDataSource();
  }

  // 실제 환경에서는 이 부분만 변경
  initializeDataSource() {
    switch (this.config.type) {
      case 'prometheus':
        return new PrometheusAdapter(this.config.prometheus);
      case 'grafana':
        return new GrafanaAdapter(this.config.grafana);
      case 'datadog':
        return new DatadogAdapter(this.config.datadog);
      case 'cloudwatch':
        return new CloudWatchAdapter(this.config.cloudwatch);
      case 'dummy':
      default:
        return new DummyDataAdapter(this.config.dummy);
    }
  }

  // 표준화된 인터페이스 (모든 데이터 소스에서 동일)
  async getServerMetrics(serverId, timeRange = '1h') {
    return await this.dataSource.fetchMetrics(serverId, timeRange);
  }

  async getServerList() {
    return await this.dataSource.fetchServerList();
  }

  async getAlerts(severity = 'all') {
    return await this.dataSource.fetchAlerts(severity);
  }
}

// 더미 데이터 어댑터 (시연용)
class DummyDataAdapter {

  constructor(config) {
    this.scenarios = config?.scenarios || this.getDefaultScenarios();
    this.simulationSpeed = config?.simulationSpeed || 1;
  }

  async fetchMetrics(serverId, timeRange) {
    // 시연용 더미 데이터 생성 (실제로는 DB 쿼리)
    const baseMetrics = this.generateBaseMetrics(serverId);
    const realtimeNoise = this.addRealtimeVariation(baseMetrics);
    
    return {
      server_id: serverId,
      timestamp: new Date().toISOString(),
      metrics: realtimeNoise,
      data_source: 'simulation'
    };
  }

  generateBaseMetrics(serverId) {
    // 실제 프로덕션 로직과 동일한 데이터 구조
    return {
      cpu: {
        usage_percent: this.randomBetween(20, 80),
        cores_used: this.randomBetween(2, 8),
        load_average: this.randomBetween(0.5, 4.0)
      },
      memory: {
        usage_percent: this.randomBetween(30, 85),
        used_gb: this.randomBetween(8, 28),
        swap_used_mb: this.randomBetween(0, 500)
      },
      disk: {
        usage_percent: this.randomBetween(40, 90),
        read_iops: this.randomBetween(100, 2000),
        write_iops: this.randomBetween(50, 1500)
      },
      network: {
        rx_bytes_sec: this.randomBetween(1000000, 100000000),
        tx_bytes_sec: this.randomBetween(500000, 50000000),
        latency_ms: this.randomBetween(1, 50),
        packet_loss_percent: this.randomBetween(0, 0.1)
      }
    };
  }
  
  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  addRealtimeVariation(baseMetrics) {
    // 실시간 변동성 추가
    const metrics = JSON.parse(JSON.stringify(baseMetrics));
    
    // CPU 변동
    metrics.cpu.usage_percent += this.randomBetween(-5, 5);
    metrics.cpu.load_average += this.randomBetween(-0.3, 0.3);
    
    // 메모리 변동
    metrics.memory.usage_percent += this.randomBetween(-3, 3);
    metrics.memory.used_gb += this.randomBetween(-1, 1);
    
    // 네트워크 변동
    metrics.network.latency_ms += this.randomBetween(-5, 5);
    
    return metrics;
  }
  
  getDefaultScenarios() {
    return [
      {
        id: "high_cpu",
        probability: 0.05,
        affectedMetrics: {
          "cpu.usage_percent": "increase_by_50%"
        }
      },
      {
        id: "memory_leak",
        probability: 0.03,
        affectedMetrics: {
          "memory.usage_percent": "increase_linear_by_5%"
        }
      }
    ];
  }
  
  async fetchServerList() {
    // 시연용 서버 목록 반환
    return [
      'k8s-master-01', 'k8s-master-02', 'k8s-master-03',
      'k8s-worker-01', 'k8s-worker-02', 'k8s-worker-03',
      'k8s-etcd-01', 'k8s-etcd-02',
      'web-server-01', 'web-server-02', 'web-server-03',
      'db-server-01', 'redis-server-01', 'monitoring-01'
    ];
  }
  
  async fetchAlerts(severity = 'all') {
    // 시연용 알림 생성
    const alerts = [];
    const severityOptions = ['critical', 'warning', 'info'];
    const types = ['cpu', 'memory', 'disk', 'network', 'application'];
    
    // 5-10개의 랜덤 알림 생성
    const count = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < count; i++) {
      const alertSeverity = severityOptions[Math.floor(Math.random() * severityOptions.length)];
      
      // 특정 심각도만 필터링
      if (severity !== 'all' && alertSeverity !== severity) continue;
      
      const type = types[Math.floor(Math.random() * types.length)];
      const serverId = await this.getRandomServer();
      
      alerts.push({
        id: `alert-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        server_id: serverId,
        severity: alertSeverity,
        type: `${type}_alert`,
        title: this.getAlertTitle(type, alertSeverity),
        description: this.getAlertDescription(type, alertSeverity),
        auto_remediation_available: Math.random() > 0.7
      });
    }
    
    return alerts;
  }
  
  async getRandomServer() {
    const servers = await this.fetchServerList();
    return servers[Math.floor(Math.random() * servers.length)];
  }
  
  getAlertTitle(type, severity) {
    const titles = {
      cpu: {
        critical: '심각한 CPU 부하',
        warning: 'CPU 사용량 경고',
        info: 'CPU 사용량 증가'
      },
      memory: {
        critical: '메모리 부족 경고',
        warning: '높은 메모리 사용량',
        info: '메모리 사용량 증가'
      },
      disk: {
        critical: '디스크 공간 부족',
        warning: '디스크 사용량 경고',
        info: '디스크 사용량 증가'
      },
      network: {
        critical: '네트워크 연결 실패',
        warning: '네트워크 지연 발생',
        info: '네트워크 트래픽 증가'
      },
      application: {
        critical: '애플리케이션 중단',
        warning: '애플리케이션 성능 저하',
        info: '애플리케이션 경고'
      }
    };
    
    return titles[type][severity];
  }
  
  getAlertDescription(type, severity) {
    const descriptions = {
      cpu: {
        critical: 'CPU 사용률이 95%를 초과하여 시스템 성능이 심각하게 저하되고 있습니다.',
        warning: 'CPU 사용률이 80%를 초과하여 시스템 성능이 저하될 수 있습니다.',
        info: 'CPU 사용률이 70%를 초과하였습니다.'
      },
      memory: {
        critical: '메모리 사용률이 95%를 초과하여 시스템 안정성이 위협받고 있습니다.',
        warning: '메모리 사용률이 85%를 초과하여 성능 저하가 발생할 수 있습니다.',
        info: '메모리 사용량이 지속적으로 증가하고 있습니다.'
      },
      disk: {
        critical: '디스크 공간이 95% 이상 사용되어 시스템 기능이 중단될 위험이 있습니다.',
        warning: '디스크 공간이 85% 이상 사용되었습니다. 불필요한 파일을 정리하세요.',
        info: '디스크 사용량이 증가 추세입니다.'
      },
      network: {
        critical: '네트워크 연결이 끊겨 서비스 접근이 불가능합니다.',
        warning: '네트워크 지연이 500ms를 초과하여 사용자 경험이 저하되고 있습니다.',
        info: '네트워크 트래픽이 평소보다 50% 증가했습니다.'
      },
      application: {
        critical: '애플리케이션이 응답하지 않아 서비스가 중단되었습니다.',
        warning: '애플리케이션 응답 시간이 2초를 초과하여 사용자 경험이 저하되고 있습니다.',
        info: '애플리케이션에서 비정상적인 패턴이 감지되었습니다.'
      }
    };
    
    return descriptions[type][severity];
  }
}

// 실제 프로덕션 어댑터 예시 (구현 준비만)
class PrometheusAdapter {
  constructor(config) {
    this.baseUrl = config?.url;
    this.auth = config?.auth;
  }

  async fetchMetrics(serverId, timeRange) {
    // 실제 Prometheus 쿼리 로직
    const queries = this.buildPrometheusQueries(serverId, timeRange);
    const results = await this.executeQueries(queries);
    return this.normalizePrometheusData(results);
  }

  buildPrometheusQueries(serverId, timeRange) {
    return {
      cpu: `cpu_usage{instance="${serverId}"}[${timeRange}]`,
      memory: `memory_usage{instance="${serverId}"}[${timeRange}]`,
      disk: `disk_usage{instance="${serverId}"}[${timeRange}]`,
      network: `network_io{instance="${serverId}"}[${timeRange}]`
    };
  }
  
  async executeQueries(queries) {
    // 실제 프로덕션 환경에서 구현
    console.log('Prometheus queries:', queries);
    return {};
  }
  
  normalizePrometheusData(results) {
    // 표준 포맷으로 변환
    return {
      server_id: '',
      timestamp: new Date().toISOString(),
      metrics: {},
      data_source: 'prometheus'
    };
  }
  
  async fetchServerList() {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
  
  async fetchAlerts(severity) {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
}

class GrafanaAdapter {
  constructor(config) {
    this.baseUrl = config?.url;
    this.apiKey = config?.apiKey;
  }
  
  async fetchMetrics(serverId, timeRange) {
    // 실제 Grafana API 호출 로직
    console.log('Fetching metrics from Grafana for server:', serverId);
    return {
      server_id: serverId,
      timestamp: new Date().toISOString(),
      metrics: {},
      data_source: 'grafana'
    };
  }
  
  async fetchServerList() {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
  
  async fetchAlerts(severity) {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
}

class DatadogAdapter {
  constructor(config) {
    this.apiKey = config?.apiKey;
    this.appKey = config?.appKey;
  }
  
  async fetchMetrics(serverId, timeRange) {
    // 실제 Datadog API 호출 로직
    console.log('Fetching metrics from Datadog for server:', serverId);
    return {
      server_id: serverId,
      timestamp: new Date().toISOString(),
      metrics: {},
      data_source: 'datadog'
    };
  }
  
  async fetchServerList() {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
  
  async fetchAlerts(severity) {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
}

class CloudWatchAdapter {
  constructor(config) {
    this.region = config?.region;
    this.credentials = config?.credentials;
  }
  
  async fetchMetrics(serverId, timeRange) {
    // 실제 AWS CloudWatch API 호출 로직
    console.log('Fetching metrics from CloudWatch for server:', serverId);
    return {
      server_id: serverId,
      timestamp: new Date().toISOString(),
      metrics: {},
      data_source: 'cloudwatch'
    };
  }
  
  async fetchServerList() {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
  
  async fetchAlerts(severity) {
    // 실제 프로덕션 환경에서 구현
    return [];
  }
} 