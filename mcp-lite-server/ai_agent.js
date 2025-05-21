// MCP 서버 AI 에이전트 - 지능형 분석 및 자연어 응답
const fs = require('fs');
const path = require('path');

// 컨텍스트 및 대화 기록 관리
const CONTEXT_HISTORY = {};
const CONTEXT_PATH = path.join(__dirname, 'context');

/**
 * 경량 NLU 구조
 * 사용자 쿼리를 인텐트(의도)와 엔티티(객체)로 분리하는 구조
 * 실제 LLM보다 간단하지만 확장 가능한 패턴 매칭 방식
 */

// 인텐트(의도) 정의
const INTENTS = {
  CPU_STATUS: { 
    patterns: [/cpu.*높|많|상태|사용|부하/i],
    description: 'CPU 상태 및 사용률 조회'
  },
  MEMORY_STATUS: { 
    patterns: [/메모리.*누수|증가|많|상태|사용/i],
    description: '메모리 상태 및 사용률 조회'
  },
  DISK_STATUS: { 
    patterns: [/디스크.*부족|상태|사용|용량|저장|공간/i],
    description: '디스크 상태 및 사용률 조회'
  },
  INCIDENT_QUERY: { 
    patterns: [/장애.*많|이벤트.*많|문제|오류|에러/i], 
    description: '장애 및 이벤트 정보 조회'
  },
  SERVER_STATUS: { 
    patterns: [/서버.*상태|노드.*상태|클러스터.*상태/i], 
    description: '전체 서버 상태 조회'
  },
  RECOMMENDATION: { 
    patterns: [/권장|추천|방법|해결|조치/i], 
    description: '문제 해결 방법 추천'
  },
  HELP: { 
    patterns: [/도움|헬프|help|명령/i], 
    description: '도움말 및 사용 방법'
  }
};

// 엔티티(객체) 정의
const ENTITIES = {
  SERVER_TYPE: {
    patterns: {
      'web': [/웹|web/i],
      'db': [/db|데이터베이스|database/i],
      'app': [/app|애플리케이션|application/i],
      'cache': [/cache|캐시|redis/i],
      'storage': [/storage|저장|스토리지/i]
    }
  },
  THRESHOLD: {
    pattern: /(\d+)(%|\s*퍼센트)/,
    extract: (match) => parseInt(match[1])
  },
  TIME_RANGE: {
    patterns: {
      'recent': [/최근|recent/i],
      'today': [/오늘|today/i],
      'week': [/주간|일주일|week/i],
      'month': [/월간|한달|month/i]
    }
  },
  SEVERITY: {
    patterns: {
      'critical': [/심각|critical/i],
      'warning': [/경고|warning/i],
      'normal': [/정상|normal/i]
    }
  }
};

// Z-스코어 계산 함수 (이상 탐지)
function zScore(arr, value) {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = Math.sqrt(arr.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / arr.length);
  if (std === 0) return 0; // 0으로 나누기 방지
  return (value - mean) / std;
}

// 메트릭 분석 함수 (통계적 이상 탐지 포함)
function analyzeMetrics(metrics) {
  if (!metrics || metrics.length === 0) {
    return [];
  }

  // 기본 메트릭 배열 준비
  const cpuArr = metrics.map(m => m.cpu || 0);
  const memArr = metrics.map(m => m.memory || 0);
  const diskArr = metrics.map(m => m.disk || 0);
  
  // Z-스코어 계산
  const cpuZ = metrics.map(m => zScore(cpuArr, m.cpu || 0));
  const memZ = metrics.map(m => zScore(memArr, m.memory || 0));
  const diskZ = metrics.map(m => zScore(diskArr, m.disk || 0));
  
  // 이상치 탐지 및 분석 결과 반환
  return metrics.map((m, i) => ({
    ...m,
    cpu_anomaly: cpuZ[i] > 2, // 2 표준편차 이상을 이상치로 판단
    memory_anomaly: memZ[i] > 2,
    disk_anomaly: diskZ[i] > 2,
    // 종합 상태 판단
    overall_status: determineOverallStatus(m, { cpuZ: cpuZ[i], memZ: memZ[i], diskZ: diskZ[i] })
  }));
}

// 종합 상태 판단 함수
function determineOverallStatus(metrics, zScores) {
  // 임계값 기준 (커스터마이징 가능)
  const thresholds = {
    critical: { cpu: 90, memory: 90, disk: 90, zScore: 3 },
    warning: { cpu: 70, memory: 70, disk: 70, zScore: 2 }
  };

  // 서비스 중단 확인
  const hasStoppedService = metrics.services && 
                           Object.values(metrics.services).some(status => status === 'stopped');
  
  // 심각한 오류 메시지 확인
  const hasCriticalError = metrics.errors && 
                          metrics.errors.some(err => typeof err === 'string' && 
                          (err.toLowerCase().includes('critical') || err.toLowerCase().includes('심각')));
  
  // 심각 상태 조건
  if (hasStoppedService || hasCriticalError || 
      metrics.cpu >= thresholds.critical.cpu || 
      metrics.memory >= thresholds.critical.memory || 
      metrics.disk >= thresholds.critical.disk ||
      zScores.cpuZ >= thresholds.critical.zScore || 
      zScores.memZ >= thresholds.critical.zScore || 
      zScores.diskZ >= thresholds.critical.zScore) {
    return 'critical';
  }
  
  // 경고 상태 조건
  if (metrics.cpu >= thresholds.warning.cpu || 
      metrics.memory >= thresholds.warning.memory || 
      metrics.disk >= thresholds.warning.disk ||
      zScores.cpuZ >= thresholds.warning.zScore || 
      zScores.memZ >= thresholds.warning.zScore || 
      zScores.diskZ >= thresholds.warning.zScore) {
    return 'warning';  
  }
  
  // 그외 정상
  return 'normal';
}

// 쿼리 분석 함수 (NLU: 인텐트 및 엔티티 추출)
function analyzeQuery(query) {
  // 입력 정규화
  const normalizedQuery = query.toLowerCase().trim();
  
  // 결과 객체 초기화
  const result = {
    original_query: query,
    intent: null,
    entities: {},
    confidence: 0
  };
  
  // 인텐트 매칭
  for (const [intentName, intent] of Object.entries(INTENTS)) {
    for (const pattern of intent.patterns) {
      if (pattern.test(normalizedQuery)) {
        result.intent = intentName;
        result.confidence = 0.8; // 기본 신뢰도
        break;
      }
    }
    if (result.intent) break;
  }
  
  // 인텐트를 찾지 못한 경우 기본값
  if (!result.intent) {
    result.intent = 'SERVER_STATUS'; // 기본 인텐트
    result.confidence = 0.3; // 낮은 신뢰도
  }
  
  // 엔티티 추출 - 서버 타입
  for (const [entityType, values] of Object.entries(ENTITIES.SERVER_TYPE.patterns)) {
    for (const pattern of values) {
      if (pattern.test(normalizedQuery)) {
        result.entities.server_type = entityType;
        break;
      }
    }
    if (result.entities.server_type) break;
  }
  
  // 엔티티 추출 - 임계값
  const thresholdMatch = normalizedQuery.match(ENTITIES.THRESHOLD.pattern);
  if (thresholdMatch) {
    result.entities.threshold = ENTITIES.THRESHOLD.extract(thresholdMatch);
  }
  
  // 엔티티 추출 - 시간 범위
  for (const [timeRange, patterns] of Object.entries(ENTITIES.TIME_RANGE.patterns)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        result.entities.time_range = timeRange;
        break;
      }
    }
    if (result.entities.time_range) break;
  }
  
  // 엔티티 추출 - 심각도
  for (const [severity, patterns] of Object.entries(ENTITIES.SEVERITY.patterns)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        result.entities.severity = severity;
        break;
      }
    }
    if (result.entities.severity) break;
  }
  
  return result;
}

// 컨텍스트 기반 자연어 응답 생성 함수
function generateNaturalResponse(queryAnalysis, metricsAnalysis, userContext) {
  // 분석된 인텐트와 엔티티 가져오기
  const { intent, entities } = queryAnalysis;
  
  // 응답 객체 초기화
  const response = {
    answer: '',
    visualization_type: null, // 시각화 유형 (차트, 표 등)
    context_used: false, // 컨텍스트를 활용했는지 여부
    related_servers: [] // 관련 서버 목록
  };
  
  // 서버 타입 필터링 (엔티티에서 서버 타입이 지정된 경우)
  let filteredMetrics = [...metricsAnalysis];
  if (entities.server_type) {
    filteredMetrics = metricsAnalysis.filter(m => 
      m.hostname.includes(entities.server_type) || 
      m.role === entities.server_type
    );
    
    if (filteredMetrics.length === 0) {
      response.answer = `${entities.server_type} 유형의 서버를 찾을 수 없습니다.`;
      return response;
    }
  }
  
  // 심각도 필터링 (엔티티에서 심각도가 지정된 경우)
  if (entities.severity) {
    filteredMetrics = filteredMetrics.filter(m => m.overall_status === entities.severity);
    
    if (filteredMetrics.length === 0) {
      response.answer = `${entities.severity} 상태의 서버를 찾을 수 없습니다.`;
      return response;
    }
  }
  
  // 이전 컨텍스트 활용 - 컨텍스트 사용 기능 강화
  if (userContext) {
    // 이전 대화에서 특정 서버에 대해 이야기했는지 확인
    if (userContext.current_focus && userContext.current_focus.type === 'server') {
      const contextServer = filteredMetrics.find(m => 
        m.hostname === userContext.current_focus.value
      );
      
      // 컨텍스트에서 특정 서버가 있고, 현재 질의가 서버 특정 없이 일반적인 상태 질문인 경우
      // 예: 이전에 "web-server-01"에 대해 이야기하다가 "CPU 상태는 어때?"라고 질문한 경우
      if (contextServer && !entities.server_type && !entities.specific_server) {
        // 사용자 질문에 특정 서버가 언급되지 않았지만 컨텍스트를 통해 특정 서버에 대한 질문으로 해석
        filteredMetrics = [contextServer];
        response.context_used = true;
        
        // 엔티티에 컨텍스트 서버 정보 추가 (향후 참조용)
        queryAnalysis.entities.specific_server = contextServer.hostname;
      }
    }
    
    // 이전 대화에서 언급된 특정 메트릭 타입이 있는지 확인
    // 예: "CPU가 높은 서버 알려줘" -> "왜 그런지 설명해줘" (설명 요청시 CPU 컨텍스트 유지)
    if (userContext.queries && userContext.queries.length > 0) {
      const lastQuery = userContext.queries[userContext.queries.length - 1];
      
      // 현재 질의가 후속 질문(왜, 어떻게, 설명) 형태이고 이전 컨텍스트가 있는 경우
      const isFollowUpQuestion = /왜|어떻게|설명|이유|원인/.test(queryAnalysis.original_query);
      
      if (isFollowUpQuestion && lastQuery.intent) {
        // 이전 인텐트와 엔티티를 현재 분석에 병합
        if (intent === 'RECOMMENDATION' || intent === 'HELP') {
          // 이전 컨텍스트의 메트릭 타입 보존 (CPU, 메모리 등)
          if (lastQuery.intent.includes('CPU') && !intent.includes('CPU')) {
            response.answer = `CPU 관련 문제의 주요 원인으로는 다음이 있습니다:\n`;
            response.answer += `1. 백그라운드 프로세스 과다 실행\n`;
            response.answer += `2. 비효율적인 애플리케이션 코드\n`;
            response.answer += `3. 리소스 경합 문제\n`;
            response.answer += `\n해결 방법으로는 프로세스 최적화, 로드 밸런싱, 자원 증설 등이 있습니다.`;
            response.context_used = true;
            return response;
          } else if (lastQuery.intent.includes('MEMORY') && !intent.includes('MEMORY')) {
            response.answer = `메모리 관련 문제의 주요 원인으로는 다음이 있습니다:\n`;
            response.answer += `1. 메모리 누수 (Memory Leak)\n`;
            response.answer += `2. 캐시 데이터 과다 축적\n`;
            response.answer += `3. 잘못된 메모리 할당 설정\n`;
            response.answer += `\n해결 방법으로는 애플리케이션 재시작, 코드 분석, 메모리 한도 설정 등이 있습니다.`;
            response.context_used = true;
            return response;
          }
        }
      }
    }
  }
  
  // 인텐트별 응답 생성
  switch (intent) {
    case 'CPU_STATUS':
      response.visualization_type = 'cpu_chart';
      
      // 임계값 설정 (엔티티에서 임계값이 지정되지 않은 경우 기본값 사용)
      const cpuThreshold = entities.threshold || 70;
      
      // CPU 사용률 기준으로 정렬
      const sortedByCpu = [...filteredMetrics].sort((a, b) => b.cpu - a.cpu);
      
      // 임계값 이상인 서버 필터링
      const highCpuServers = sortedByCpu.filter(s => s.cpu >= cpuThreshold);
      
      if (highCpuServers.length === 0) {
        response.answer = `CPU 사용률이 ${cpuThreshold}% 이상인 서버가 없습니다.`;
      } else {
        response.answer = `현재 CPU 사용률이 ${cpuThreshold}% 이상인 서버는 ${highCpuServers.map(s => `${s.hostname}(${s.cpu.toFixed(1)}%)`).join(', ')}입니다.`;
        
        // 이상치 감지 서버가 있는 경우 추가 정보 제공
        const anomalyServers = highCpuServers.filter(s => s.cpu_anomaly);
        if (anomalyServers.length > 0) {
          response.answer += `\n\n이 중 ${anomalyServers.map(s => s.hostname).join(', ')}는(은) 통계적으로 비정상적(CPU 스파이크)입니다.`;
          response.answer += '\n원인: 백그라운드 작업, 서비스 트래픽 급증, 프로세스 폭주 등.';
          response.answer += '\n권장 조치: 불필요한 프로세스 종료, 서비스 분산, 리소스 증설.';
        }
        
        // 관련 서버 정보 추가
        response.related_servers = highCpuServers.map(s => s.hostname);
      }
      break;
      
    case 'MEMORY_STATUS':
      response.visualization_type = 'memory_chart';
      
      // 임계값 설정
      const memoryThreshold = entities.threshold || 70;
      
      // 메모리 사용률 기준으로 정렬
      const sortedByMemory = [...filteredMetrics].sort((a, b) => b.memory - a.memory);
      
      // 임계값 이상인 서버 필터링
      const highMemoryServers = sortedByMemory.filter(s => s.memory >= memoryThreshold);
      
      if (highMemoryServers.length === 0) {
        response.answer = `메모리 사용률이 ${memoryThreshold}% 이상인 서버가 없습니다.`;
      } else {
        response.answer = `현재 메모리 사용률이 ${memoryThreshold}% 이상인 서버는 ${highMemoryServers.map(s => `${s.hostname}(${s.memory.toFixed(1)}%)`).join(', ')}입니다.`;
        
        // 메모리 누수 의심 서버 정보 제공
        const leakServers = highMemoryServers.filter(s => s.memory_anomaly);
        if (leakServers.length > 0) {
          response.answer += `\n\n이 중 ${leakServers.map(s => s.hostname).join(', ')}는(은) 메모리 누수가 의심됩니다.`;
          response.answer += '\n원인: 애플리케이션 메모리 누수, 장기 실행 작업, 캐시 증가 등.';
          response.answer += '\n권장 조치: 애플리케이션 재시작, 메모리 프로파일링, 리소스 한도 설정.';
        }
        
        // 관련 서버 정보 추가
        response.related_servers = highMemoryServers.map(s => s.hostname);
      }
      break;
      
    case 'DISK_STATUS':
      response.visualization_type = 'disk_chart';
      
      // 임계값 설정
      const diskThreshold = entities.threshold || 70;
      
      // 디스크 사용률 기준으로 정렬
      const sortedByDisk = [...filteredMetrics].sort((a, b) => b.disk - a.disk);
      
      // 임계값 이상인 서버 필터링
      const highDiskServers = sortedByDisk.filter(s => s.disk >= diskThreshold);
      
      if (highDiskServers.length === 0) {
        response.answer = `디스크 사용률이 ${diskThreshold}% 이상인 서버가 없습니다.`;
      } else {
        response.answer = `현재 디스크 사용률이 ${diskThreshold}% 이상인 서버는 ${highDiskServers.map(s => `${s.hostname}(${s.disk.toFixed(1)}%)`).join(', ')}입니다.`;
        
        // 디스크 공간 부족 심각 서버 정보 제공
        const criticalDiskServers = highDiskServers.filter(s => s.disk >= 90);
        if (criticalDiskServers.length > 0) {
          response.answer += `\n\n이 중 ${criticalDiskServers.map(s => s.hostname).join(', ')}는(은) 디스크 공간이 심각하게 부족합니다.`;
          response.answer += '\n원인: 로그 파일 증가, 임시 파일 누적, 데이터베이스 증가 등.';
          response.answer += '\n권장 조치: 불필요한 파일 정리, 로그 로테이션 설정, 디스크 확장.';
        }
        
        // 관련 서버 정보 추가
        response.related_servers = highDiskServers.map(s => s.hostname);
      }
      break;
      
    case 'INCIDENT_QUERY':
      response.visualization_type = 'incident_timeline';
      
      // 장애 이벤트가 있는 서버 필터링
      const incidentServers = filteredMetrics.filter(s => s.errors && s.errors.length > 0);
      
      if (incidentServers.length === 0) {
        response.answer = '현재 장애 이벤트가 발생한 서버가 없습니다.';
      } else {
        // 서버별 장애 빈도 계산
        const freq = {};
        incidentServers.forEach(s => { 
          freq[s.hostname] = (freq[s.hostname] || 0) + s.errors.length;
        });
        
        // 장애 빈도 기준으로 정렬
        const sortedByIncidents = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        
        response.answer = `최근 장애가 가장 많았던 서버: ${sortedByIncidents[0][0]} (${sortedByIncidents[0][1]}회)`;
        
        // 해당 서버의 장애 이벤트 목록 추가
        const topServerEvents = incidentServers
          .filter(s => s.hostname === sortedByIncidents[0][0])
          .flatMap(s => s.errors);
          
        response.answer += `\n주요 이벤트: ${topServerEvents.join(', ')}`;
        response.answer += '\n권장 조치: 서비스 재시작 및 로드 밸런싱 검토';
        
        // 관련 서버 정보 추가
        response.related_servers = sortedByIncidents.map(item => item[0]);
      }
      break;
      
    case 'SERVER_STATUS':
      response.visualization_type = 'status_summary';
      
      // 상태별 서버 수 계산
      const statusCount = {
        critical: filteredMetrics.filter(s => s.overall_status === 'critical').length,
        warning: filteredMetrics.filter(s => s.overall_status === 'warning').length,
        normal: filteredMetrics.filter(s => s.overall_status === 'normal').length
      };
      
      response.answer = `현재 모니터링 중인 서버 ${filteredMetrics.length}대 중 `;
      response.answer += `${statusCount.critical}대가 심각, ${statusCount.warning}대가 경고, ${statusCount.normal}대가 정상 상태입니다.`;
      
      // 심각 상태 서버 정보 추가
      if (statusCount.critical > 0) {
        const criticalServers = filteredMetrics.filter(s => s.overall_status === 'critical');
        response.answer += `\n\n심각 상태 서버: ${criticalServers.map(s => s.hostname).join(', ')}`;
        
        // 주요 문제 요약
        const criticalIssues = criticalServers.map(s => {
          if (s.cpu >= 90) return `${s.hostname}의 CPU 과부하`;
          if (s.memory >= 90) return `${s.hostname}의 메모리 부족`;
          if (s.disk >= 90) return `${s.hostname}의 디스크 공간 부족`;
          if (s.services && Object.values(s.services).some(status => status === 'stopped')) {
            return `${s.hostname}의 서비스 중단`;
          }
          return `${s.hostname}의 문제`;
        });
        
        response.answer += `\n주요 문제: ${criticalIssues.join(', ')}`;
      }
      
      // 관련 서버 정보 추가
      response.related_servers = filteredMetrics
        .filter(s => s.overall_status !== 'normal')
        .map(s => s.hostname);
      break;
      
    case 'RECOMMENDATION':
      response.visualization_type = 'recommendation';
      
      // 문제가 있는 서버 필터링
      const problemServers = filteredMetrics.filter(s => s.overall_status !== 'normal');
      
      if (problemServers.length === 0) {
        response.answer = '현재 모든 서버가 정상 상태입니다. 특별한 조치가 필요하지 않습니다.';
      } else {
        response.answer = '권장 조치 사항:\n\n';
        
        // 문제 유형별 권장 조치 제공
        const cpuIssue = problemServers.some(s => s.cpu >= 90 || s.cpu_anomaly);
        const memoryIssue = problemServers.some(s => s.memory >= 90 || s.memory_anomaly);
        const diskIssue = problemServers.some(s => s.disk >= 90 || s.disk_anomaly);
        const serviceIssue = problemServers.some(s => 
          s.services && Object.values(s.services).some(status => status === 'stopped')
        );
        
        if (cpuIssue) {
          response.answer += '1. CPU 과부하 문제:\n';
          response.answer += '   - 불필요한 프로세스 종료 (top 명령어로 확인)\n';
          response.answer += '   - 작업 부하 분산 또는 스케일 아웃 검토\n';
          response.answer += '   - 리소스 사용량이 많은 애플리케이션 최적화\n\n';
        }
        
        if (memoryIssue) {
          response.answer += '2. 메모리 부족 문제:\n';
          response.answer += '   - 애플리케이션 재시작으로 메모리 누수 해소\n';
          response.answer += '   - 메모리 사용량 많은 프로세스 확인 (ps aux --sort=-%mem)\n';
          response.answer += '   - 메모리 한도 설정 및 스왑 공간 확인\n\n';
        }
        
        if (diskIssue) {
          response.answer += '3. 디스크 공간 부족 문제:\n';
          response.answer += '   - 오래된 로그 파일 정리 (find /var/log -name "*.log" -size +100M)\n';
          response.answer += '   - 임시 파일 및 캐시 정리 (/tmp, /var/cache)\n';
          response.answer += '   - 디스크 확장 또는 불필요한 데이터 아카이빙\n\n';
        }
        
        if (serviceIssue) {
          response.answer += '4. 서비스 중단 문제:\n';
          response.answer += '   - 서비스 로그 확인 (journalctl -u SERVICE_NAME)\n';
          response.answer += '   - 의존성 서비스 상태 점검\n';
          response.answer += '   - 서비스 재시작 및 설정 파일 검토\n\n';
        }
        
        // 관련 서버 정보 추가
        response.related_servers = problemServers.map(s => s.hostname);
      }
      break;
      
    case 'HELP':
      response.visualization_type = 'help';
      
      response.answer = '다음과 같은 질문을 할 수 있습니다:\n\n';
      response.answer += '- "CPU 사용률이 높은 서버는?"\n';
      response.answer += '- "메모리 누수가 의심되는 서버는?"\n';
      response.answer += '- "디스크 공간이 부족한 서버는?"\n';
      response.answer += '- "최근 장애가 많은 서버는?"\n';
      response.answer += '- "서버 상태 요약해줘"\n';
      response.answer += '- "문제 해결 방법 알려줘"\n';
      break;
      
    default:
      response.answer = '죄송합니다. 요청을 이해하지 못했습니다. "도움말"을 입력하시면 사용 가능한 명령어를 확인할 수 있습니다.';
  }
  
  return response;
}

// 컨텍스트 불러오기 (텍스트 파일 기반)
function loadContextDocument(contextName) {
  try {
    const filePath = path.join(CONTEXT_PATH, `${contextName}.txt`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  } catch (error) {
    console.error(`컨텍스트 파일 로드 오류: ${error.message}`);
    return null;
  }
}

// 컨텍스트 사용 응답 생성 함수
function generateContextBasedResponse(query, contextName) {
  // 컨텍스트 문서 로드
  const contextContent = loadContextDocument(contextName);
  if (!contextContent) {
    return {
      answer: '컨텍스트 정보를 찾을 수 없습니다.',
      context_used: false
    };
  }
  
  // 분석된 쿼리 내용
  const queryAnalysis = analyzeQuery(query);
  
  // 컨텍스트 문서에서 관련 정보 찾기 (개선된 매칭 알고리즘)
  const lines = contextContent.split('\n');
  const keyTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  // 각 줄의 관련성 점수 계산
  const lineScores = lines.map(line => {
    const normalized = line.toLowerCase();
    let score = 0;
    
    // 각 키워드별 매칭 점수
    keyTerms.forEach(term => {
      if (normalized.includes(term)) {
        score += 1;
      }
    });
    
    // 인텐트 관련 키워드 매칭
    if (queryAnalysis.intent) {
      const intentKeywords = INTENTS[queryAnalysis.intent].patterns
        .map(pattern => pattern.toString().replace(/[\/\^\$\*\+\?\.\(\)\[\]\{\}\|\\]/g, ''))
        .filter(kw => kw.length > 2);
        
      intentKeywords.forEach(kw => {
        if (normalized.includes(kw)) {
          score += 0.5;
        }
      });
    }
    
    return { line, score };
  });
  
  // 점수 기준 정렬 및 상위 매칭 내용 선택
  const topMatches = lineScores
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.line);
    
  // 응답 생성
  if (topMatches.length === 0) {
    return {
      answer: '컨텍스트에서 관련 정보를 찾지 못했습니다.',
      context_used: true
    };
  }
  
  // 가장 관련성 높은 내용 사용
  const bestMatch = topMatches[0];
  
  // 추가 컨텍스트 내용 병합 (필요한 경우)
  let additionalContext = '';
  if (topMatches.length > 1) {
    additionalContext = topMatches.slice(1).join('\n\n');
  }
  
  return {
    answer: bestMatch,
    additional_context: additionalContext,
    context_used: true
  };
}

// 사용자 컨텍스트 업데이트 함수
function updateContext(userId, queryAnalysis, response, metricsAnalysis) {
  // 이전 컨텍스트가 없으면 새로 생성
  if (!CONTEXT_HISTORY[userId]) {
    CONTEXT_HISTORY[userId] = {
      queries: [],
      responses: [],
      current_focus: null
    };
  }
  
  // 관련 서버 중 하나를 현재 포커스로 설정 (있는 경우)
  let currentFocus = null;
  if (response.related_servers && response.related_servers.length > 0) {
    currentFocus = {
      type: 'server',
      value: response.related_servers[0]
    };
  }
  
  // 엔티티에 specific_server가 있는 경우 이를 우선 사용
  if (queryAnalysis.entities && queryAnalysis.entities.specific_server) {
    currentFocus = {
      type: 'server',
      value: queryAnalysis.entities.specific_server
    };
  }
  
  // 기존 엔티티 유지하면서 새 엔티티 추가
  const entities = { ...queryAnalysis.entities };
  if (currentFocus && currentFocus.type === 'server') {
    entities.specific_server = currentFocus.value;
  }
  
  // 쿼리 및 응답 기록 업데이트
  const context = CONTEXT_HISTORY[userId];
  context.queries.push({
    text: queryAnalysis.original_query,
    intent: queryAnalysis.intent,
    entities,
    timestamp: new Date().toISOString()
  });
  
  context.responses.push({
    text: response.answer,
    visualization_type: response.visualization_type,
    timestamp: new Date().toISOString()
  });
  
  // 기록 크기 제한 (최근 10개만 유지)
  if (context.queries.length > 10) {
    context.queries.shift();
    context.responses.shift();
  }
  
  // 현재 포커스 업데이트
  context.current_focus = currentFocus;
  
  // 컨텍스트 사용 여부 추가 저장
  context.last_context_used = response.context_used;
  
  // 업데이트된 컨텍스트 반환
  return CONTEXT_HISTORY[userId];
}

// 백엔드 API에 노출할 함수들
module.exports = {
  // 사용자 쿼리 처리 함수
  handleUserQuery: (userId, question, metrics) => {
    // 메트릭 분석
    const metricsAnalysis = analyzeMetrics(metrics);
    
    // 사용자 질의 분석
    const queryAnalysis = analyzeQuery(question);
    
    // 사용자 컨텍스트 가져오기
    const userContext = CONTEXT_HISTORY[userId];
    
    // 자연어 응답 생성
    const response = generateNaturalResponse(queryAnalysis, metricsAnalysis, userContext);
    
    // 사용자 컨텍스트 업데이트
    const updatedContext = updateContext(userId, queryAnalysis, response, metricsAnalysis);
    
    // 결과 반환
    return { 
      answer: response.answer, 
      analysis: metricsAnalysis,
      visualization_type: response.visualization_type,
      related_servers: response.related_servers || [],
      query_analysis: queryAnalysis
    };
  },
  
  // 컨텍스트 기반 응답 생성 함수
  handleContextQuery: (query, contextName) => {
    const response = generateContextBasedResponse(query, contextName);
    return response;
  },
  
  // 질의 분석 함수만 별도로 제공 (프론트와 공유 가능)
  analyzeQuery
};
