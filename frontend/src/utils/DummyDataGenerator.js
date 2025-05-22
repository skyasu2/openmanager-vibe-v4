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
}

// 브라우저 환경에서 전역 함수로도 접근 가능하도록 설정 (하위 호환성)
window.generateDummyData = generateDummyData; 