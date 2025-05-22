/**
 * 시뮬레이션 데이터 생성기
 * 서버 모니터링 데이터와 장애 시나리오를 생성합니다.
 */

export class SimulationDataGenerator {
  constructor() {
    this.timeStart = new Date('2025-05-22T00:00:00Z');
    this.timeEnd = new Date('2025-05-22T23:59:59Z');
    this.intervalMinutes = 10;
    this.serverTypes = {
      'k8s-master': {
        baseMetrics: {
          cpu_usage: { min: 20, max: 50 },
          memory_usage: { min: 30, max: 60 },
          disk_usage: { min: 40, max: 70 },
          network_io: { min: 200, max: 800 },
          pod_count: { min: 15, max: 25 },
          etcd_latency: { min: 1, max: 5 }
        }
      },
      'k8s-worker': {
        baseMetrics: {
          cpu_usage: { min: 30, max: 70 },
          memory_usage: { min: 40, max: 75 },
          disk_usage: { min: 50, max: 80 },
          network_io: { min: 500, max: 2000 },
          pod_count: { min: 30, max: 80 },
          container_count: { min: 50, max: 120 }
        }
      },
      'k8s-etcd': {
        baseMetrics: {
          cpu_usage: { min: 10, max: 40 },
          memory_usage: { min: 30, max: 60 },
          disk_usage: { min: 40, max: 60 },
          network_io: { min: 100, max: 300 },
          etcd_latency: { min: 1, max: 3 },
          key_count: { min: 5000, max: 10000 }
        }
      },
      'web-server': {
        baseMetrics: {
          cpu_usage: { min: 20, max: 60 },
          memory_usage: { min: 30, max: 70 },
          disk_usage: { min: 40, max: 70 },
          request_count: { min: 1000, max: 5000 },
          response_time: { min: 10, max: 100 },
          active_connections: { min: 50, max: 500 }
        }
      },
      'db-server': {
        baseMetrics: {
          cpu_usage: { min: 30, max: 70 },
          memory_usage: { min: 50, max: 80 },
          disk_usage: { min: 60, max: 85 },
          query_count: { min: 500, max: 3000 },
          slow_queries: { min: 0, max: 10 },
          connection_count: { min: 20, max: 200 },
          replication_lag: { min: 0, max: 5 }
        }
      },
      'redis-server': {
        baseMetrics: {
          cpu_usage: { min: 10, max: 50 },
          memory_usage: { min: 50, max: 80 },
          disk_usage: { min: 30, max: 60 },
          connected_clients: { min: 50, max: 300 },
          evicted_keys: { min: 0, max: 50 },
          rejected_connections: { min: 0, max: 10 }
        }
      },
      'monitoring': {
        baseMetrics: {
          cpu_usage: { min: 20, max: 60 },
          memory_usage: { min: 30, max: 70 },
          disk_usage: { min: 40, max: 75 },
          alert_count: { min: 0, max: 30 },
          scrape_duration: { min: 10, max: 100 },
          target_count: { min: 50, max: 100 }
        }
      }
    };
    
    // 장애 시나리오 목록
    this.scenarios = [
      {
        id: "network_packet_loss",
        probability: 0.05,
        affectedServerTypes: ["k8s-master", "k8s-worker", "web-server"],
        metricChanges: {
          network_io: "increase_by_200%",
          cpu_usage: "increase_by_20%"
        }
      },
      {
        id: "storage_disk_full",
        probability: 0.03,
        affectedServerTypes: ["db-server", "monitoring", "k8s-etcd"],
        metricChanges: {
          disk_usage: "increase_to_95%",
          cpu_usage: "increase_by_30%"
        }
      },
      {
        id: "application_memory_leak",
        probability: 0.04,
        affectedServerTypes: ["web-server", "k8s-worker"],
        metricChanges: {
          memory_usage: "increase_linear_to_95%",
          cpu_usage: "increase_by_40%"
        }
      },
      {
        id: "application_service_crash",
        probability: 0.02,
        affectedServerTypes: ["k8s-master", "web-server", "monitoring"],
        metricChanges: {
          cpu_usage: "spike_to_100%",
          memory_usage: "increase_by_50%"
        }
      }
    ];
  }

  // 타임스탬프 목록 생성 (24시간 x 10분 간격 = 144개)
  generateTimestamps() {
    const timestamps = [];
    const currentTime = new Date(this.timeStart);
    
    while (currentTime <= this.timeEnd) {
      timestamps.push(new Date(currentTime));
      currentTime.setMinutes(currentTime.getMinutes() + this.intervalMinutes);
    }
    
    return timestamps;
  }

  // 서버 ID에 따른 서버 유형 반환
  getServerType(serverId) {
    if (serverId.startsWith('k8s-master')) return 'k8s-master';
    if (serverId.startsWith('k8s-worker')) return 'k8s-worker';
    if (serverId.startsWith('k8s-etcd')) return 'k8s-etcd';
    if (serverId.startsWith('web-server')) return 'web-server';
    if (serverId.startsWith('db-server')) return 'db-server';
    if (serverId.startsWith('redis-server')) return 'redis-server';
    if (serverId.startsWith('monitoring')) return 'monitoring';
    return 'unknown';
  }

  // min과 max 사이의 임의 값 생성
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 시간대별 부하 패턴 (일반적으로 주간에 높고 야간에 낮음)
  getDailyPattern(timestamp) {
    if (!timestamp) return 0;
    
    const hour = timestamp.getHours();
    // 업무 시간(9-18시)에는 부하가 높음
    if (hour >= 9 && hour < 18) {
      return 20 + (Math.sin((hour - 9) * Math.PI / 9) * 15);
    }
    // 새벽(0-6시)에는 부하가 낮음
    if (hour >= 0 && hour < 6) {
      return -10;
    }
    // 저녁(18-24시)에는 점진적으로 감소
    return 10 - ((hour - 18) * 2);
  }

  // 기본 메트릭 생성
  generateBaseMetrics(serverId, timestamp) {
    const serverType = this.getServerType(serverId);
    const baseMetrics = this.serverTypes[serverType]?.baseMetrics || {};
    const result = {};
    
    // 모든 서버에 공통적인 기본 메트릭
    const commonMetrics = {
      cpu_usage: { min: 10, max: 50 },
      memory_usage: { min: 20, max: 60 },
      disk_usage: { min: 30, max: 70 },
      network_io: { min: 100, max: 500 }
    };
    
    // 공통 메트릭 추가
    for (const [key, range] of Object.entries(commonMetrics)) {
      result[key] = this.randomBetween(range.min, range.max) + this.getDailyPattern(timestamp);
    }
    
    // 서버 타입별 특수 메트릭 추가
    for (const [key, range] of Object.entries(baseMetrics)) {
      if (!result[key]) { // 중복 방지
        result[key] = this.randomBetween(range.min, range.max);
      }
    }
    
    return result;
  }

  // 해당 시간에 활성화된 장애 시나리오 찾기
  getActiveScenariosAtTime(timestamp, allScenarios = []) {
    // 임의로 시나리오 활성화 여부 결정
    const activeScenarios = [];
    
    this.scenarios.forEach(scenario => {
      // 특정 시간대에만 장애 발생 가능성 증가
      let probability = scenario.probability;
      const hour = timestamp.getHours();
      
      // 피크 시간(10-14시)에는 장애 발생 확률 증가
      if (hour >= 10 && hour <= 14) {
        probability *= 2;
      }
      
      if (Math.random() < probability) {
        activeScenarios.push(scenario);
      }
    });
    
    return activeScenarios;
  }

  // 장애 효과를 메트릭에 적용
  applyScenarioEffects(baseMetrics, activeScenarios) {
    const modifiedMetrics = { ...baseMetrics };
    
    activeScenarios.forEach(scenario => {
      for (const [metricName, changeType] of Object.entries(scenario.metricChanges)) {
        if (modifiedMetrics[metricName] === undefined) continue;
        
        // 각 변경 유형에 따른 처리
        if (changeType.startsWith('increase_by_')) {
          const percentage = parseInt(changeType.replace('increase_by_', '').replace('%', ''));
          modifiedMetrics[metricName] *= (1 + percentage / 100);
        } 
        else if (changeType.startsWith('decrease_by_')) {
          const percentage = parseInt(changeType.replace('decrease_by_', '').replace('%', ''));
          modifiedMetrics[metricName] *= (1 - percentage / 100);
        }
        else if (changeType.startsWith('increase_to_')) {
          const target = parseInt(changeType.replace('increase_to_', '').replace('%', ''));
          modifiedMetrics[metricName] = Math.max(modifiedMetrics[metricName], target);
        }
        else if (changeType === 'spike_to_100%') {
          modifiedMetrics[metricName] = 100;
        }
      }
    });
    
    return modifiedMetrics;
  }

  // 서버별 메트릭 데이터 생성
  generateServerMetrics(serverId) {
    const timestamps = this.generateTimestamps();
    const metrics = [];
    
    timestamps.forEach(timestamp => {
      const activeScenarios = this.getActiveScenariosAtTime(timestamp);
      const baseMetrics = this.generateBaseMetrics(serverId, timestamp);
      const modifiedMetrics = this.applyScenarioEffects(baseMetrics, activeScenarios);
      
      metrics.push({
        timestamp: timestamp.toISOString(),
        server_id: serverId,
        ...modifiedMetrics,
        active_scenarios: activeScenarios.map(s => s.id),
        status: this.determineServerStatus(modifiedMetrics)
      });
    });
    
    return metrics;
  }
  
  // 메트릭 값에 따른 서버 상태 결정
  determineServerStatus(metrics) {
    // CPU, 메모리, 디스크 사용량이 임계치를 넘으면 경고 또는 심각
    if (metrics.cpu_usage >= 90 || metrics.memory_usage >= 90 || metrics.disk_usage >= 90) {
      return 'critical';
    }
    if (metrics.cpu_usage >= 80 || metrics.memory_usage >= 80 || metrics.disk_usage >= 80) {
      return 'warning';
    }
    return 'normal';
  }

  // 모든 서버의 메트릭 데이터 생성
  generateAllServersMetrics(serverIds) {
    const result = {};
    
    serverIds.forEach(serverId => {
      result[serverId] = this.generateServerMetrics(serverId);
    });
    
    return result;
  }
} 