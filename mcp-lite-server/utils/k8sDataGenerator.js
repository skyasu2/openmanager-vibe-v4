/**
 * OpenManager AI 쿠버네티스 클러스터 더미 데이터 생성기
 * - 실제 쿠버네티스 클러스터와 유사한 구조의 데이터 생성
 * - 30개 서버 (컨트롤 플레인 3, 워커 노드 27)
 * - 시간 기반 시나리오 구현
 */

// 쿠버네티스 노드 구성 (총 30개 노드)
const K8S_NODES = [
  // 컨트롤 플레인 노드 (마스터)
  { 
    id: 'k8s-master-01', 
    role: 'control-plane', 
    type: 'master',
    services: ['kube-apiserver', 'kube-scheduler', 'kube-controller-manager', 'etcd'],
    hardware: { cpu: 8, memory: 32, disk: 500 }
  },
  { 
    id: 'k8s-master-02', 
    role: 'control-plane', 
    type: 'master',
    services: ['kube-apiserver', 'kube-scheduler', 'kube-controller-manager', 'etcd'],
    hardware: { cpu: 8, memory: 32, disk: 500 }
  },
  { 
    id: 'k8s-master-03', 
    role: 'control-plane', 
    type: 'master',
    services: ['kube-apiserver', 'kube-scheduler', 'kube-controller-manager', 'etcd'],
    hardware: { cpu: 8, memory: 32, disk: 500 }
  },
  
  // 애플리케이션 워커 노드 그룹 (웹 서비스)
  { 
    id: 'k8s-web-worker-01', 
    role: 'worker', 
    type: 'web',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'nginx-ingress'],
    hardware: { cpu: 16, memory: 64, disk: 1000 }
  },
  { 
    id: 'k8s-web-worker-02', 
    role: 'worker', 
    type: 'web',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'nginx-ingress'],
    hardware: { cpu: 16, memory: 64, disk: 1000 }
  },
  { 
    id: 'k8s-web-worker-03', 
    role: 'worker', 
    type: 'web',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'nginx-ingress'],
    hardware: { cpu: 16, memory: 64, disk: 1000 }
  },
  
  // 데이터베이스 워커 노드 그룹
  { 
    id: 'k8s-db-worker-01', 
    role: 'worker', 
    type: 'database',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'postgresql'],
    hardware: { cpu: 32, memory: 128, disk: 2000 }
  },
  { 
    id: 'k8s-db-worker-02', 
    role: 'worker', 
    type: 'database',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'postgresql'],
    hardware: { cpu: 32, memory: 128, disk: 2000 }
  },
  { 
    id: 'k8s-db-worker-03', 
    role: 'worker', 
    type: 'database',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'postgresql'],
    hardware: { cpu: 32, memory: 128, disk: 2000 }
  },
  
  // 캐시 워커 노드 그룹
  { 
    id: 'k8s-cache-worker-01', 
    role: 'worker', 
    type: 'cache',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'redis'],
    hardware: { cpu: 16, memory: 64, disk: 500 }
  },
  { 
    id: 'k8s-cache-worker-02', 
    role: 'worker', 
    type: 'cache',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'redis'],
    hardware: { cpu: 16, memory: 64, disk: 500 }
  },
  
  // 로깅 및 모니터링 노드 그룹
  { 
    id: 'k8s-monitoring-worker-01', 
    role: 'worker', 
    type: 'monitoring',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'prometheus', 'grafana'],
    hardware: { cpu: 8, memory: 32, disk: 1000 }
  },
  { 
    id: 'k8s-monitoring-worker-02', 
    role: 'worker', 
    type: 'monitoring',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'elasticsearch', 'kibana'],
    hardware: { cpu: 8, memory: 32, disk: 1000 }
  },
  
  // 배치 처리 워커 노드 그룹
  { 
    id: 'k8s-batch-worker-01', 
    role: 'worker', 
    type: 'batch',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'spark'],
    hardware: { cpu: 24, memory: 96, disk: 1500 }
  },
  { 
    id: 'k8s-batch-worker-02', 
    role: 'worker', 
    type: 'batch',
    services: ['kubelet', 'kube-proxy', 'container-runtime', 'spark'],
    hardware: { cpu: 24, memory: 96, disk: 1500 }
  },
  
  // 일반 워커 노드 (나머지)
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `k8s-worker-${String(i + 1).padStart(2, '0')}`,
    role: 'worker',
    type: 'general',
    services: ['kubelet', 'kube-proxy', 'container-runtime'],
    hardware: { cpu: 16, memory: 64, disk: 1000 }
  }))
];

/**
 * 24시간 데이터를 10분 간격으로 생성하는 함수
 * @param {Date} baseDate 기준 날짜 (기본값: 현재 날짜)
 * @returns {Array} 생성된 데이터 배열
 */
function generate24hDemoData(baseDate = new Date()) {
  // 기준 시간을 0시 0분으로 설정
  const startTime = new Date(baseDate);
  startTime.setHours(0, 0, 0, 0);
  
  const result = [];
  const nodeCount = K8S_NODES.length;
  const sampleCount = 144; // 24시간 × 6 (10분마다)
  
  // 각 노드별 초기 상태
  const nodeStates = {};
  K8S_NODES.forEach(node => {
    nodeStates[node.id] = {
      cpu_baseline: 15 + Math.random() * 10,
      mem_baseline: node.hardware.memory * 1024 * 0.2 + Math.random() * 200, // 초기 메모리 사용량 (기본 20%)
      disk_baseline: 5 + Math.random() * 10,
      net_baseline: 40 + Math.random() * 25,
      pod_count: node.type === 'master' ? 15 : (10 + Math.floor(Math.random() * 20)),
      restart_accumulation: 0,
      is_affected: false,
      recovery_phase: false,
      service_failures: [],
      type: node.type,
      role: node.role,
      services: [...node.services],
      hardware: {...node.hardware}
    };
  });
  
  // 시간대별 계수 (트래픽 패턴)
  function getTimeBasedFactor(hour) {
    if (hour >= 0 && hour < 6) return 0.6;        // 새벽 (배치 작업)
    if (hour >= 6 && hour < 9) return 0.8;        // 아침 (메모리 증가)
    if (hour >= 9 && hour < 12) return 1.2;       // 업무 시작
    if (hour >= 12 && hour < 13) return 0.9;      // 점심
    if (hour >= 13 && hour < 18) return 1.5;      // 업무 피크
    if (hour >= 18 && hour < 21) return 0.7;      // 퇴근
    return 0.8;                                   // 저녁
  }
  
  // 각 10분 간격마다 데이터 생성
  for (let i = 0; i < sampleCount; i++) {
    const timestamp = new Date(startTime.getTime() + i * 10 * 60 * 1000);
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    const timeFactor = getTimeBasedFactor(hour);
    
    // 시간대별 시나리오 적용
    const isBusinessHours = hour >= 9 && hour < 18;
    const isMorningMemoryGrowth = hour >= 6 && hour < 9;
    const isEveningRecovery = hour >= 18 && hour < 24;
    const isPeakHours = hour >= 13 && hour < 18;
    const isLunchTime = hour >= 12 && hour < 13;
    const isBatchTime = hour >= 0 && hour < 6;
    
    // 특수 시간대 지표
    const isCPUSpike = minute % 30 === 0; // 30분 간격 CPU 스파이크
    
    // 연쇄 장애 패턴 (13:00~18:00 사이 발생 확률 증가)
    const cascadeFailureChance = isPeakHours ? 0.04 : 0.002;
    const cascadeFailureTriggered = Math.random() < cascadeFailureChance;
    
    // 연쇄 장애 발생 시 영향 받는 노드 설정
    if (cascadeFailureTriggered) {
      // 장애 시작점 - 주로 웹 서버나 DB 서버에서 시작
      const failureOrigin = Math.random() > 0.5 ? 'k8s-web-worker-01' : 'k8s-db-worker-01';
      nodeStates[failureOrigin].is_affected = true;
      
      // 1단계 장애 전파
      setTimeout(() => {
        if (failureOrigin.includes('web')) {
          nodeStates['k8s-web-worker-02'].is_affected = true;
          nodeStates['k8s-web-worker-03'].is_affected = true;
        } else {
          nodeStates['k8s-db-worker-02'].is_affected = true;
        }
      }, 0);
      
      // 2단계 장애 전파 (마스터 노드까지 영향)
      if (Math.random() > 0.7) {
        setTimeout(() => {
          nodeStates['k8s-master-01'].is_affected = true;
        }, 0);
      }
    }
    
    // 노드 별 데이터 생성
    K8S_NODES.forEach(node => {
      const nodeId = node.id;
      const nodeState = nodeStates[nodeId];
      
      // 기본 변동 패턴
      const randomFactor = 0.7 + (Math.random() * 0.6);
      let cpuUsage = nodeState.cpu_baseline * timeFactor * randomFactor;
      let memUsed = nodeState.mem_baseline * (timeFactor * 0.7 + 0.3) * randomFactor;
      let diskIoWait = nodeState.disk_baseline * timeFactor * randomFactor;
      let netLatency = nodeState.net_baseline * timeFactor * randomFactor;
      
      // 노드 유형별 특수 패턴
      if (node.type === 'master' && nodeState.is_affected) {
        // 마스터 노드 장애는 심각도 높음
        cpuUsage *= 2.5;
        netLatency *= 2.5;
      }
      else if (node.type === 'database') {
        // DB 노드는 메모리 사용량 높음
        memUsed *= 1.2;
        if (nodeState.is_affected) {
          diskIoWait *= 3; // DB 장애 시 디스크 I/O 대기 시간 급증
        }
      }
      else if (node.type === 'web' && isBusinessHours) {
        // 웹 노드는 업무 시간에 트래픽 증가
        cpuUsage *= 1.3;
        netLatency *= 1.2;
      }
      else if (node.type === 'batch' && isBatchTime) {
        // 배치 노드는 새벽 시간대에 작업량 증가
        cpuUsage *= 2;
        diskIoWait *= 1.5;
      }
      else if (node.type === 'cache') {
        // 캐시 노드는 메모리 사용량 변동 큼
        memUsed *= 0.9 + Math.random() * 0.6;
      }
      
      // 시나리오별 특수 패턴 적용
      // 1. 새벽 배치 작업 (주기적 CPU 스파이크 + 디스크 I/O 증가)
      if (isBatchTime && minute % 20 === 0 && node.type === 'batch') {
        cpuUsage *= 2.5;
        diskIoWait *= 3;
        nodeState.service_failures = Math.random() > 0.8 ? ['spark-executor'] : [];
      }
      
      // 2. 메모리 점진 증가 + 스왑 발생
      if (isMorningMemoryGrowth) {
        memUsed += (hour - 6) * 60; // 시간당 60MB씩 증가
      }
      
      // 3. 업무 시간 CPU/메모리 동시 증가 + 네트워크 지연
      if (isBusinessHours) {
        cpuUsage *= 1.2;
        memUsed *= 1.1;
        netLatency *= 1.3;
      }
      
      // 4. 점심 시간 트래픽 감소
      if (isLunchTime) {
        cpuUsage *= 0.7;
        netLatency *= 0.8;
      }
      
      // 5. 업무 피크 시간 부하 분산 실패 → 연쇄 장애
      if (isPeakHours && nodeState.is_affected) {
        cpuUsage *= 2;
        netLatency *= 3;
        nodeState.restart_accumulation += 1; // 파드 재시작 증가
        
        // 서비스 장애 추가
        if (node.type === 'master') {
          nodeState.service_failures = ['kube-apiserver'];
        } else if (node.type === 'web') {
          nodeState.service_failures = ['nginx-ingress'];
        } else if (node.type === 'database') {
          nodeState.service_failures = ['postgresql'];
        } else {
          nodeState.service_failures = ['kubelet'];
        }
      }
      
      // 6. 퇴근/저녁 시간 자원 급감 + 자가 복구
      if (isEveningRecovery) {
        if (nodeState.is_affected && !nodeState.recovery_phase) {
          nodeState.recovery_phase = true;
        }
        
        if (nodeState.recovery_phase) {
          // 점진적 리소스 회복
          nodeState.restart_accumulation = Math.max(0, nodeState.restart_accumulation - 0.5);
          cpuUsage = Math.max(nodeState.cpu_baseline, cpuUsage * 0.85);
          memUsed = Math.max(nodeState.mem_baseline, memUsed * 0.9);
          
          // 완전히 복구되면 상태 초기화
          if (nodeState.restart_accumulation <= 0) {
            nodeState.is_affected = false;
            nodeState.recovery_phase = false;
            nodeState.service_failures = [];
          }
        }
      }
      
      // 노드별 특수 패턴 처리
      // 특정 웹 워커 노드에 정각마다 CPU 스파이크 발생
      if (nodeId === 'k8s-web-worker-02' && isCPUSpike) {
        cpuUsage = 90 + Math.random() * 10;
      }
      
      // 특정 DB 워커에서 자원 경합 발생
      if (nodeId === 'k8s-db-worker-01') {
        if (cpuUsage > 70 && memUsed > nodeState.mem_baseline * 1.2) {
          netLatency *= 2.5; // 자원 경합 시 지연 급증
          diskIoWait *= 2;
        }
      }
      
      // 특정 시점에 모니터링 노드 장애 발생
      if (nodeId.includes('monitoring') && hour === 14 && minute >= 30 && minute < 50) {
        cpuUsage = 95;
        nodeState.service_failures = ['prometheus', 'alertmanager'];
        nodeState.is_affected = true;
      }
      
      // 값 제한 및 반올림
      cpuUsage = Math.min(100, Math.round(cpuUsage * 10) / 10);
      memUsed = Math.round(memUsed);
      const swapUsage = memUsed > nodeState.mem_baseline * 1.5 ? 
        Math.round((memUsed - nodeState.mem_baseline * 1.5) * 0.7) : 0;
      diskIoWait = Math.round(diskIoWait * 10) / 10;
      netLatency = Math.round(netLatency);
      
      // 파드 상태 및 재시작 횟수
      const restartCount = Math.round(nodeState.restart_accumulation);
      let podStatus = 'Running';
      
      // 상태 결정
      if (nodeState.is_affected) {
        if (cpuUsage > 90 && memUsed > nodeState.mem_baseline * 1.8) {
          podStatus = 'CrashLoopBackOff';
        } else if (cpuUsage > 80 || memUsed > nodeState.mem_baseline * 1.5) {
          podStatus = 'Warning';
        }
      }
      
      // 패킷 손실은 네트워크 지연과 연계
      const packetLoss = netLatency > 80 ? (netLatency - 80) * 0.1 : 0;
      
      // 서비스 상태 결정
      const serviceStatuses = {};
      nodeState.services.forEach(service => {
        if (nodeState.service_failures.includes(service)) {
          serviceStatuses[service] = 'Failed';
        } else if (nodeState.is_affected && Math.random() > 0.7) {
          serviceStatuses[service] = 'Degraded';
        } else {
          serviceStatuses[service] = 'Running';
        }
      });
      
      // 이벤트 생성
      const events = [];
      if (restartCount > 2) events.push('container_restart');
      if (cpuUsage > 90) events.push('cpu_throttling');
      if (swapUsage > 100) events.push('memory_pressure');
      if (packetLoss > 1) events.push('network_bottleneck');
      if (isCPUSpike && nodeId === 'k8s-web-worker-02') events.push('cpu_spike_detected');
      if (nodeState.service_failures.length > 0) {
        events.push(`service_failure:${nodeState.service_failures.join(',')}`);
      }
      
      // 상태 결정
      let status = 'normal';
      if (cpuUsage > 90 || memUsed > nodeState.mem_baseline * 1.8 || restartCount > 5 || packetLoss > 5 || nodeState.service_failures.length > 0) {
        status = 'critical';
      } else if (cpuUsage > 75 || memUsed > nodeState.mem_baseline * 1.5 || restartCount > 1 || packetLoss > 0.5) {
        status = 'warning';
      }
      
      // 로그 메시지 생성
      let logMessage = '';
      if (status === 'critical') {
        if (nodeState.service_failures.length > 0) {
          logMessage = `서비스 장애 발생: ${nodeState.service_failures.join(', ')}`;
        } else if (cpuUsage > 90) {
          logMessage = `CPU 사용량 임계치 초과: ${cpuUsage.toFixed(1)}%`;
        } else if (memUsed > nodeState.mem_baseline * 1.8) {
          logMessage = `메모리 부족 경고: ${memUsed}MB 사용 중`;
        } else if (packetLoss > 5) {
          logMessage = `네트워크 패킷 손실 발생: ${packetLoss.toFixed(1)}%`;
        }
      } else if (status === 'warning') {
        if (cpuUsage > 75) {
          logMessage = `CPU 사용량 경고: ${cpuUsage.toFixed(1)}%`;
        } else if (memUsed > nodeState.mem_baseline * 1.5) {
          logMessage = `메모리 사용량 주의: ${memUsed}MB`;
        } else if (restartCount > 0) {
          logMessage = `컨테이너 재시작 발생: ${restartCount}회`;
        }
      } else {
        logMessage = `정상 상태: ${nodeId}`;
      }
      
      // 메트릭 모음
      const metrics = {
        // 기본 메트릭
        node_type: node.type,
        node_role: node.role,
        
        // CPU 메트릭
        cpu_usage_pct: cpuUsage,
        load_avg_1m: (cpuUsage / 100 * node.hardware.cpu * 0.7 * randomFactor).toFixed(2),
        throttle_count: cpuUsage > 80 ? Math.floor((cpuUsage - 80) / 4) : 0,
        
        // 메모리 메트릭
        mem_used_mb: memUsed,
        mem_total_mb: node.hardware.memory * 1024,
        page_faults: memUsed > nodeState.mem_baseline * 1.2 ? Math.round(memUsed / 15) : 0,
        swap_usage_mb: swapUsage,
        
        // 디스크 메트릭
        io_wait_ms: diskIoWait,
        disk_read_mb: Math.round(diskIoWait * 3 * randomFactor),
        disk_write_mb: Math.round(diskIoWait * 4 * randomFactor),
        disk_total_gb: node.hardware.disk,
        
        // 네트워크 메트릭
        packet_loss_pct: Math.round(packetLoss * 10) / 10,
        latency_ms: netLatency,
        bandwidth_mbps: Math.round(100 - (netLatency / 3)),
        
        // 쿠버네티스 메트릭
        pod_status: podStatus,
        pod_count: nodeState.pod_count,
        restart_count: restartCount,
        k8s_event: events.length > 0 ? events[0] : 'normal',
        
        // 서비스 상태
        services: serviceStatuses
      };
      
      // 결과 데이터 추가
      result.push({
        timestamp: timestamp.toISOString(),
        node_id: nodeId,
        metrics,
        status,
        events,
        log: logMessage
      });
    });
  }
  
  return result;
}

/**
 * 현재 시간 기준 최근 1시간 데이터를 동적 생성
 * @param {Date} baseTime 기준 시간 (기본값: 현재 시간)
 * @returns {Array} 생성된 1시간 데이터
 */
function generateRecentHourData(baseTime = new Date()) {
  const result = [];
  const nodeCount = K8S_NODES.length;
  const samplesPerHour = 6; // 10분 간격
  
  // 현재 시간으로부터 1시간 전으로 기준 시간 설정
  const startTime = new Date(baseTime);
  startTime.setHours(startTime.getHours() - 1);
  startTime.setMinutes(Math.floor(startTime.getMinutes() / 10) * 10, 0, 0);
  
  // 노드별 기본 상태 초기화
  const nodeStates = {};
  K8S_NODES.forEach(node => {
    nodeStates[node.id] = {
      cpu_baseline: 20 + Math.random() * 30,
      mem_baseline: node.hardware.memory * 1024 * 0.3, // 기본 30% 메모리 사용
      service_failures: [],
      is_affected: Math.random() > 0.9, // 10% 확률로 장애 상태로 시작
      type: node.type,
      role: node.role
    };
  });
  
  // 1시간 6개 샘플 생성 (10분 간격)
  for (let i = 0; i < samplesPerHour; i++) {
    const timestamp = new Date(startTime.getTime() + i * 10 * 60 * 1000);
    const currentHour = timestamp.getHours();
    
    // 시간대별 부하 계수 (현재 시간 기준)
    let loadFactor = 1.0;
    if (currentHour >= 9 && currentHour < 18) {
      loadFactor = 1.3; // 업무 시간
    } else if (currentHour >= 0 && currentHour < 6) {
      loadFactor = 0.7; // 새벽
    }
    
    // 복구 단계가 진행 중인지 확인 (후반부에는 복구 진행)
    const isRecoveryPhase = i >= samplesPerHour / 2;
    
    // 노드별 데이터 생성
    K8S_NODES.forEach(node => {
      const nodeId = node.id;
      const state = nodeStates[nodeId];
      const randomVariation = 0.8 + Math.random() * 0.4;
      
      // 장애 복구 로직
      if (state.is_affected && isRecoveryPhase) {
        // 점진적 복구
        if (Math.random() > 0.3) {
          state.is_affected = false;
          state.service_failures = [];
        }
      }
      
      // 메트릭 값 계산
      let cpuUsage = state.cpu_baseline * loadFactor * randomVariation;
      let memUsed = state.mem_baseline * randomVariation;
      
      // 장애 있는 경우 메트릭 악화
      if (state.is_affected) {
        cpuUsage *= 1.5;
        memUsed *= 1.2;
        
        // 서비스 장애 결정
        if (state.service_failures.length === 0) {
          if (node.type === 'master') {
            state.service_failures = Math.random() > 0.5 ? ['kube-apiserver'] : [];
          } else if (node.type === 'web') {
            state.service_failures = Math.random() > 0.5 ? ['nginx-ingress'] : [];
          } else if (node.type === 'database') {
            state.service_failures = Math.random() > 0.5 ? ['postgresql'] : [];
          }
        }
      }
      
      // 값 제한
      cpuUsage = Math.min(100, Math.round(cpuUsage * 10) / 10);
      memUsed = Math.round(memUsed);
      const latency = Math.round(20 + (cpuUsage / 10));
      
      // 서비스 상태 결정
      const serviceStatuses = {};
      node.services.forEach(service => {
        if (state.service_failures.includes(service)) {
          serviceStatuses[service] = 'Failed';
        } else if (state.is_affected && Math.random() > 0.7) {
          serviceStatuses[service] = 'Degraded';
        } else {
          serviceStatuses[service] = 'Running';
        }
      });
      
      // 상태 계산
      let status = 'normal';
      if (cpuUsage > 90 || memUsed > state.mem_baseline * 1.5 || state.service_failures.length > 0) {
        status = 'critical';
      } else if (cpuUsage > 70 || memUsed > state.mem_baseline * 1.2) {
        status = 'warning';
      }
      
      // 이벤트 생성
      const events = [];
      if (cpuUsage > 85) events.push('high_cpu_usage');
      if (memUsed > state.mem_baseline * 1.3) events.push('memory_pressure');
      if (state.service_failures.length > 0) {
        events.push(`service_failure:${state.service_failures.join(',')}`);
      }
      
      // 로그 메시지 생성
      let logMessage = '';
      if (status === 'critical') {
        if (state.service_failures.length > 0) {
          logMessage = `서비스 장애 발생: ${state.service_failures.join(', ')}`;
        } else if (cpuUsage > 90) {
          logMessage = `CPU 사용량 임계치 초과: ${cpuUsage.toFixed(1)}%`;
        } else {
          logMessage = `메모리 부족 경고: ${memUsed}MB 사용 중`;
        }
      } else if (status === 'warning') {
        if (cpuUsage > 75) {
          logMessage = `CPU 사용량 경고: ${cpuUsage.toFixed(1)}%`;
        } else {
          logMessage = `메모리 사용량 주의: ${memUsed}MB`;
        }
      } else {
        logMessage = `정상 상태: ${nodeId}`;
      }
      
      result.push({
        timestamp: timestamp.toISOString(),
        node_id: nodeId,
        metrics: {
          node_type: node.type,
          node_role: node.role,
          cpu_usage_pct: cpuUsage,
          load_avg_1m: (cpuUsage / 100 * node.hardware.cpu * 0.7).toFixed(2),
          throttle_count: cpuUsage > 80 ? Math.floor((cpuUsage - 80) / 10) : 0,
          mem_used_mb: memUsed,
          mem_total_mb: node.hardware.memory * 1024,
          page_faults: memUsed > state.mem_baseline * 1.2 ? Math.round(memUsed / 20) : 0,
          swap_usage_mb: memUsed > state.mem_baseline * 1.3 ? Math.round((memUsed - state.mem_baseline * 1.3) * 0.5) : 0,
          io_wait_ms: Math.round(5 + (cpuUsage / 20)),
          disk_read_mb: Math.round(10 + Math.random() * 40),
          disk_write_mb: Math.round(5 + Math.random() * 25),
          disk_total_gb: node.hardware.disk,
          packet_loss_pct: latency > 50 ? ((latency - 50) / 100).toFixed(1) : 0,
          latency_ms: latency,
          bandwidth_mbps: Math.round(100 - (latency / 2)),
          pod_status: cpuUsage > 85 ? 'Warning' : 'Running',
          pod_count: Math.floor(10 + Math.random() * 20),
          restart_count: state.is_affected ? Math.floor(1 + Math.random() * 3) : 0,
          k8s_event: events.length > 0 ? events[0] : 'normal',
          services: serviceStatuses
        },
        status,
        events,
        log: logMessage
      });
    });
  }
  
  return result;
}

module.exports = {
  generate24hDemoData,
  generateRecentHourData,
  K8S_NODES
};