/**
 * OpenManager AI - 서버 시뮬레이션 데이터 생성기
 * 실시간 서버 모니터링을 위한 현실적인 시뮬레이션 데이터를 제공합니다.
 */

/**
 * 서버 상태에 따른 색상 코드
 */
const STATUS_COLORS = {
  critical: '#ff4757',
  warning: '#ffa502',
  normal: '#2ed573'
};

/**
 * 서버 타입별 아이콘 정의
 */
const SERVER_TYPE_ICONS = {
  'k8s-master': 'kubernetes',
  'k8s-worker': 'kubernetes',
  'k8s-etcd': 'kubernetes',
  'web-server': 'web',
  'db-server': 'database',
  'redis-server': 'cache',
  'monitoring': 'monitor'
};

/**
 * 서버 ID 목록 - 30대 서버
 */
const SERVER_IDS = [
  // Kubernetes 클러스터 (15대)
  'k8s-master-01', 'k8s-master-02', 'k8s-master-03',
  'k8s-worker-01', 'k8s-worker-02', 'k8s-worker-03', 'k8s-worker-04', 'k8s-worker-05',
  'k8s-worker-06', 'k8s-worker-07', 'k8s-worker-08', 'k8s-worker-09', 'k8s-worker-10',
  'k8s-etcd-01', 'k8s-etcd-02',
  
  // 온프레미스 서버 (15대)
  'web-server-01', 'web-server-02', 'web-server-03', 'web-server-04', 'web-server-05',
  'db-server-01', 'db-server-02', 'db-server-03',
  'redis-server-01', 'redis-server-02', 'redis-server-03',
  'monitoring-01', 'monitoring-02', 'monitoring-03', 'monitoring-04'
];

/**
 * 서버 유형 추출 함수
 */
function getServerType(serverId) {
  if (serverId.startsWith('k8s-master')) return 'k8s-master';
  if (serverId.startsWith('k8s-worker')) return 'k8s-worker';
  if (serverId.startsWith('k8s-etcd')) return 'k8s-etcd';
  if (serverId.startsWith('web-server')) return 'web-server';
  if (serverId.startsWith('db-server')) return 'db-server';
  if (serverId.startsWith('redis-server')) return 'redis-server';
  if (serverId.startsWith('monitoring')) return 'monitoring';
  return 'unknown';
}

/**
 * 메인 더미 데이터 생성 함수 - 기존 함수명 유지(하위 호환성)
 */
export function generateDummyData(count = 30) {
  const servers = [];
  
  // 요청된 서버 수에 맞게 데이터 생성
  const serverIds = SERVER_IDS.slice(0, count);
  
  // 서버 메타데이터와 메트릭 데이터 결합
  for (const serverId of serverIds) {
    try {
      // 서버 유형 확인
      const serverType = getServerType(serverId);
      const serverNumber = serverId.split('-').pop();
      
      // 메트릭 데이터 생성
      const cpu = Math.floor(Math.random() * 100);
      const memory = Math.floor(Math.random() * 100);
      const disk = Math.floor(Math.random() * 100);
      
      // 상태 결정 (약 15%의 서버가 경고 또는 심각 상태)
      let status = 'normal';
      if (cpu >= 90 || memory >= 90 || disk >= 90 || Math.random() < 0.04) {
        status = 'critical';
      } else if (cpu >= 75 || memory >= 75 || disk >= 75 || Math.random() < 0.11) {
        status = 'warning';
      }
      
      // 서버 객체 생성
      const server = {
        id: serverId,
        name: `${serverType.replace('-', ' ').toUpperCase()} ${serverNumber}`,
        type: serverType,
        status: status,
        statusColor: STATUS_COLORS[status],
        icon: SERVER_TYPE_ICONS[serverType] || 'server',
        metrics: {
          cpu_usage: cpu,
          memory_usage: memory,
          disk_usage: disk,
          network_io: Math.floor(Math.random() * 1000) + 100
        },
        lastUpdated: new Date().toISOString()
      };
      
      servers.push(server);
    } catch (error) {
      console.error(`Error generating data for ${serverId}:`, error);
    }
  }
  
  // 상태에 따라 정렬 (심각 > 경고 > 정상)
  return servers.sort((a, b) => {
    const statusOrder = { critical: 0, warning: 1, normal: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

// 클래스로도 export
export default class DummyDataGenerator {
  constructor() {
    this.serverIds = [...SERVER_IDS];
    this.incidentPeriods = this.generateIncidentPeriods(); // 장애 발생 구간 생성
  }
  
  getServers(count = 30) {
    return generateDummyData(count);
  }
  
  getServerHistoricalData(serverId, hours = 24) {
    const data = [];
    const now = new Date();
    
    // 지정된 시간만큼의 과거 데이터 생성 (10분 간격)
    for (let i = 0; i < hours * 6; i++) {
      const timestamp = new Date(now);
      timestamp.setMinutes(now.getMinutes() - (i * 10));
      
      data.push({
        timestamp: timestamp.toISOString(),
        server_id: serverId,
        cpu_usage: Math.floor(Math.random() * 100),
        memory_usage: Math.floor(Math.random() * 100),
        disk_usage: Math.floor(Math.random() * 100),
        network_io: Math.floor(Math.random() * 1000) + 100,
        status: Math.random() < 0.85 ? 'normal' : (Math.random() < 0.7 ? 'warning' : 'critical')
      });
    }
    
    return data.reverse();
  }

  // 24시간 × 144개 타임스탬프 (10분 간격) 생성
  generateTimeSeriesForPeriod(startTime, endTime) {
    const data = {};
    const servers = this.serverIds;
    
    servers.forEach(serverId => {
      data[serverId] = [];
      
      const current = new Date(startTime);
      while (current <= endTime) {
        // 정상 구간 vs 장애 구간 구분하여 데이터 생성
        const isIncidentPeriod = this.isIncidentPeriod(current);
        const metrics = isIncidentPeriod 
          ? this.generateIncidentMetrics(serverId, current)
          : this.generateNormalMetrics(serverId, current);
          
        data[serverId].push({
          timestamp: new Date(current),
          metrics: metrics
        });
        
        current.setMinutes(current.getMinutes() + 10); // 10분 간격
      }
    });
    
    return data;
  }

  // 장애 발생 구간 생성 (24시간 중 3-4시간 정도 장애 상황 발생)
  generateIncidentPeriods() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // 3-4개의 장애 상황 생성
    const incidentCount = Math.floor(Math.random() * 2) + 2; // 2-3개
    const incidents = [];
    
    for (let i = 0; i < incidentCount; i++) {
      // 랜덤 시작 시간 (24시간 내)
      const startOffset = Math.floor(Math.random() * 22 * 60 * 60 * 1000); // 22시간 내에서 시작 (끝나는 시간 고려)
      const startTime = new Date(twentyFourHoursAgo.getTime() + startOffset);
      
      // 장애 지속 시간 (20분-2시간)
      const durationMs = (Math.floor(Math.random() * 7) + 2) * 10 * 60 * 1000; // 20분-120분 (10분 간격)
      const endTime = new Date(startTime.getTime() + durationMs);
      
      // 장애 유형
      const incidentType = ['cpu_spike', 'memory_leak', 'network_latency'][Math.floor(Math.random() * 3)];
      
      // 영향받는 서버 (랜덤 선택, 10-40%)
      const affectedServerCount = Math.floor(this.serverIds.length * (0.1 + Math.random() * 0.3));
      const shuffledServers = [...this.serverIds].sort(() => 0.5 - Math.random());
      const affectedServers = shuffledServers.slice(0, affectedServerCount);
      
      incidents.push({
        start: startTime,
        end: endTime,
        type: incidentType,
        affectedServers: affectedServers
      });
    }
    
    // 시간순 정렬
    return incidents.sort((a, b) => a.start - b.start);
  }

  // 특정 시간이 장애 구간인지 확인
  isIncidentPeriod(time) {
    return this.incidentPeriods.some(incident => 
      time >= incident.start && time <= incident.end
    );
  }

  // 특정 시간에 영향받는 서버인지 확인
  isAffectedServer(serverId, time) {
    const incident = this.incidentPeriods.find(inc => 
      time >= inc.start && time <= inc.end
    );
    
    return incident && incident.affectedServers.includes(serverId);
  }

  // 특정 시간의 장애 유형 가져오기
  getIncidentType(time) {
    const incident = this.incidentPeriods.find(inc => 
      time >= inc.start && time <= inc.end
    );
    
    return incident ? incident.type : null;
  }

  // 정상 구간의 메트릭 생성
  generateNormalMetrics(serverId, timestamp) {
    const serverType = getServerType(serverId);
    
    // 서버 유형별 기본 메트릭 값 설정
    const baseMetrics = {
      'k8s-master': { cpu: 30, memory: 45, disk: 50 },
      'k8s-worker': { cpu: 40, memory: 50, disk: 60 },
      'k8s-etcd': { cpu: 25, memory: 40, disk: 55 },
      'web-server': { cpu: 35, memory: 45, disk: 50 },
      'db-server': { cpu: 45, memory: 60, disk: 70 },
      'redis-server': { cpu: 30, memory: 70, disk: 40 },
      'monitoring': { cpu: 25, memory: 40, disk: 60 }
    }[serverType] || { cpu: 30, memory: 40, disk: 50 };
    
    // 랜덤 변동 추가 (±15%)
    const variation = 15;
    
    return {
      cpu: {
        usage_percent: Math.min(85, Math.max(10, baseMetrics.cpu + (Math.random() * variation * 2 - variation))),
        process_count: Math.floor(Math.random() * 50) + 50
      },
      memory: {
        usage_percent: Math.min(85, Math.max(10, baseMetrics.memory + (Math.random() * variation * 2 - variation))),
        total_gb: serverType.includes('db') ? 64 : (serverType.includes('k8s') ? 32 : 16)
      },
      disk: {
        usage_percent: Math.min(85, Math.max(10, baseMetrics.disk + (Math.random() * variation * 2 - variation))),
        io_wait_ms: Math.floor(Math.random() * 5) + 1
      },
      network: {
        bandwidth_usage_percent: Math.floor(Math.random() * 30) + 10,
        latency_ms: Math.floor(Math.random() * 10) + 5
      }
    };
  }

  // 장애 구간의 메트릭 생성
  generateIncidentMetrics(serverId, timestamp) {
    const isAffected = this.isAffectedServer(serverId, timestamp);
    if (!isAffected) {
      // 영향받지 않는 서버는 정상 메트릭 반환
      return this.generateNormalMetrics(serverId, timestamp);
    }
    
    const incidentType = this.getIncidentType(timestamp);
    const serverType = getServerType(serverId);
    const normalMetrics = this.generateNormalMetrics(serverId, timestamp);
    
    // 장애 유형별 메트릭 조정
    switch (incidentType) {
      case 'cpu_spike':
        // CPU 사용률 급증 (85-98%)
        normalMetrics.cpu.usage_percent = 85 + Math.random() * 13;
        normalMetrics.cpu.process_count = Math.floor(normalMetrics.cpu.process_count * 1.5);
        break;
        
      case 'memory_leak':
        // 메모리 사용률 증가 (80-95%)
        normalMetrics.memory.usage_percent = 80 + Math.random() * 15;
        break;
        
      case 'network_latency':
        // 네트워크 지연 증가 (100-500ms)
        normalMetrics.network.latency_ms = 100 + Math.random() * 400;
        normalMetrics.network.bandwidth_usage_percent = 70 + Math.random() * 20;
        break;
    }
    
    return normalMetrics;
  }
}

// 브라우저 환경에서 전역 함수로도 접근 가능하도록 설정 (하위 호환성)
window.generateDummyData = generateDummyData; 