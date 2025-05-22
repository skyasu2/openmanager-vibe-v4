export class TimelineAnalyzer {
  constructor() {
    this.eventCorrelator = new EventCorrelator();
    this.causalChainDetector = new CausalChainDetector();
    this.reportGenerator = new AutoReportGenerator();
    this.knowledgeBase = new OperationalKnowledgeBase();
  }

  // 24시간 기준으로 변경
  async analyzeIncidentTimeline(startTime = null, endTime = null) {
    // 기본값: 지난 24시간
    if (!startTime || !endTime) {
      endTime = new Date();
      startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24시간 전
    }

    const analysis = {
      timeline_period: { start: startTime, end: endTime },
      normal_period: null,        // 언제까지 정상이었는지
      incident_start: null,       // 언제부터 문제인지
      what_happened: [],          // 무엇이 발생했는지
      where_occurred: [],         // 어디서 발생했는지  
      why_happened: null,         // 왜 발생했는지 (근본원인)
      how_to_respond: [],         // 어떻게 대응할지
      business_impact: null,
      lessons_learned: [],
      prevention_recommendations: [],
      causal_chain: []            // 기존 호환성 유지
    };

    // 1. 24시간 동안의 모든 서버 데이터 수집
    const timeSeriesData = await this.collectTimeSeriesData(startTime, endTime);
    
    // 2. 정상/비정상 구간 식별
    const { normalPeriod, incidentPeriods } = this.identifyNormalAndIncidentPeriods(timeSeriesData);
    analysis.normal_period = normalPeriod;
    analysis.incident_start = incidentPeriods.length > 0 ? incidentPeriods[0].start : null;
    
    // 3. 기존 로직 호환성 유지
    const chronologicalEvents = this.buildChronologicalEventMap(timeSeriesData);
    analysis.causal_chain = await this.detectCausalChain(chronologicalEvents);
    
    // 4. 6하원칙 기반 분석
    analysis.what_happened = await this.analyzeWhatHappened(timeSeriesData, incidentPeriods);
    analysis.where_occurred = this.analyzeWhereOccurred(analysis.what_happened);
    analysis.why_happened = await this.analyzeWhyHappened(analysis.what_happened);
    analysis.how_to_respond = await this.generateResponsePlan(analysis);
    
    // 5. 기존 로직 호환성 유지
    analysis.business_impact = this.calculateBusinessImpact(analysis.causal_chain);
    
    return analysis;
  }

  // 정상/비정상 구간 식별 (새로운 핵심 기능)
  identifyNormalAndIncidentPeriods(timeSeriesData) {
    const periods = {
      normalPeriod: { start: null, end: null },
      incidentPeriods: []
    };

    // 시간순으로 이상 징후 탐지
    const anomalies = [];
    for (const [serverId, metrics] of Object.entries(timeSeriesData)) {
      metrics.forEach(dataPoint => {
        const serverAnomalies = this.detectAnomaliesInDataPoint(dataPoint, serverId);
        anomalies.push(...serverAnomalies.map(a => ({...a, timestamp: dataPoint.timestamp, server_id: serverId})));
      });
    }

    // 시간순 정렬
    anomalies.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (anomalies.length === 0) {
      // 24시간 내내 정상
      periods.normalPeriod = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
        status: "완전 정상"
      };
    } else {
      // 첫 번째 이상 징후 전까지가 정상 구간
      periods.normalPeriod = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(anomalies[0].timestamp),
        duration: this.calculateDuration(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date(anomalies[0].timestamp))
      };

      // 이상 징후 구간들 식별
      let currentIncident = {
        start: new Date(anomalies[0].timestamp),
        end: null,
        events: []
      };

      anomalies.forEach((anomaly, index) => {
        currentIncident.events.push(anomaly);
        
        // 다음 이상 징후와 30분 이상 차이나면 별개 사건으로 처리
        if (index < anomalies.length - 1) {
          const timeDiff = new Date(anomalies[index + 1].timestamp) - new Date(anomaly.timestamp);
          if (timeDiff > 30 * 60 * 1000) { // 30분
            currentIncident.end = new Date(anomaly.timestamp);
            periods.incidentPeriods.push(currentIncident);
            currentIncident = {
              start: new Date(anomalies[index + 1].timestamp),
              end: null,
              events: []
            };
          }
        } else {
          // 마지막 이상 징후
          currentIncident.end = new Date();
        }
      });

      if (currentIncident.events.length > 0) {
        periods.incidentPeriods.push(currentIncident);
      }
    }

    return periods;
  }

  // What: 무엇이 발생했는지 분석
  async analyzeWhatHappened(timeSeriesData, incidentPeriods) {
    const whatHappened = [];

    incidentPeriods.forEach(period => {
      const periodAnalysis = {
        timeframe: `${new Date(period.start).toLocaleString()} ~ ${new Date(period.end).toLocaleString()}`,
        duration: this.calculateDuration(period.start, period.end),
        primary_symptoms: [],
        secondary_effects: [],
        affected_metrics: [],
        severity_level: 'unknown'
      };

      // 주요 증상 식별
      const symptomsByType = {};
      period.events.forEach(event => {
        if (!symptomsByType[event.type]) {
          symptomsByType[event.type] = [];
        }
        symptomsByType[event.type].push(event);
      });

      // 주요 증상 정리
      for (const [type, events] of Object.entries(symptomsByType)) {
        const servers = [...new Set(events.map(e => e.server_id))];
        periodAnalysis.primary_symptoms.push({
          type: this.translateEventType(type),
          affected_servers: servers,
          count: events.length,
          description: this.generateSymptomDescription(type, servers, events)
        });
      }

      // 심각도 계산
      const criticalEvents = period.events.filter(e => e.severity === 'critical');
      if (criticalEvents.length >= 3) {
        periodAnalysis.severity_level = 'critical';
      } else if (criticalEvents.length >= 1) {
        periodAnalysis.severity_level = 'warning';
      } else {
        periodAnalysis.severity_level = 'info';
      }

      whatHappened.push(periodAnalysis);
    });

    return whatHappened;
  }

  // Where: 어디서 발생했는지 분석
  analyzeWhereOccurred(whatHappened) {
    const locations = {
      affected_systems: [],
      impact_zones: [],
      propagation_path: []
    };

    whatHappened.forEach(incident => {
      incident.primary_symptoms.forEach(symptom => {
        // 영향받은 시스템 분류
        symptom.affected_servers.forEach(server => {
          const systemType = this.classifySystemType(server);
          if (!locations.affected_systems.find(s => s.type === systemType)) {
            locations.affected_systems.push({
              type: systemType,
              servers: [server],
              criticality: this.getSystemCriticality(systemType)
            });
          } else {
            const existing = locations.affected_systems.find(s => s.type === systemType);
            if (!existing.servers.includes(server)) {
              existing.servers.push(server);
            }
          }
        });
      });
    });

    // 전파 경로 분석
    locations.propagation_path = this.analyzePropagationPath(whatHappened);

    return locations;
  }

  // Why: 왜 발생했는지 근본원인 분석
  async analyzeWhyHappened(whatHappened) {
    const rootCauseAnalysis = {
      immediate_cause: null,      // 직접적 원인
      underlying_cause: null,     // 근본적 원인  
      contributing_factors: [],   // 기여 요인들
      hypothesis_confidence: 0,   // 가설 신뢰도
      evidence_strength: 'low'    // 증거 강도
    };

    if (whatHappened.length === 0) {
      return {
        conclusion: "분석 기간 동안 특별한 이상 징후가 발견되지 않았습니다.",
        system_health: "excellent"
      };
    }

    // 가장 초기 증상부터 분석
    const earliestIncident = whatHappened[0];
    const firstSymptom = earliestIncident.primary_symptoms[0];

    // 직접적 원인 추론
    rootCauseAnalysis.immediate_cause = this.inferImmediateCause(firstSymptom);
    
    // 근본적 원인 추론 (지식베이스 활용)
    rootCauseAnalysis.underlying_cause = await this.knowledgeBase.inferRootCause(
      firstSymptom, 
      earliestIncident,
      whatHappened
    );

    // 기여 요인들 식별
    rootCauseAnalysis.contributing_factors = this.identifyContributingFactors(whatHappened);

    // 신뢰도 계산
    rootCauseAnalysis.hypothesis_confidence = this.calculateHypothesisConfidence(rootCauseAnalysis);

    return rootCauseAnalysis;
  }

  // How: 어떻게 대응할지 계획 생성
  async generateResponsePlan(analysis) {
    const responsePlan = {
      immediate_actions: [],      // 즉시 조치 (0-30분)
      short_term_actions: [],     // 단기 조치 (1-24시간)  
      medium_term_actions: [],    // 중기 조치 (1-7일)
      long_term_prevention: [],   // 장기 예방 (1개월+)
      monitoring_enhancement: [], // 모니터링 강화
      escalation_criteria: [],    // 에스컬레이션 기준
      rollback_procedures: []     // 롤백 절차
    };

    // 지식베이스에서 대응 방안 조회
    if (analysis.why_happened && analysis.why_happened.underlying_cause) {
      const kbResponse = await this.knowledgeBase.getResponseProcedures(
        analysis.why_happened.underlying_cause,
        analysis.what_happened,
        analysis.where_occurred
      );
      
      responsePlan.immediate_actions = kbResponse.immediate || [];
      responsePlan.short_term_actions = kbResponse.short_term || [];
      responsePlan.medium_term_actions = kbResponse.medium_term || [];
      responsePlan.long_term_prevention = kbResponse.prevention || [];
    }

    // 기본 대응 방안 (지식베이스에 없는 경우)
    if (responsePlan.immediate_actions.length === 0) {
      responsePlan.immediate_actions = this.generateDefaultImmediateActions(analysis);
    }

    return responsePlan;
  }

  // 시간순 이벤트 맵 구축 (AI의 핵심 로직)
  buildChronologicalEventMap(timeSeriesData) {
    const events = [];
    
    for (const [serverId, metrics] of Object.entries(timeSeriesData)) {
      metrics.forEach(dataPoint => {
        // 각 메트릭에서 이상 징후 탐지
        const anomalies = this.detectAnomaliesInDataPoint(dataPoint, serverId);
        
        anomalies.forEach(anomaly => {
          events.push({
            timestamp: dataPoint.timestamp,
            server_id: serverId,
            event_type: anomaly.type,
            severity: anomaly.severity,
            metric_values: dataPoint.metrics,
            description: anomaly.description,
            potential_causes: anomaly.potential_causes || []
          });
        });
      });
    }

    // 시간순 정렬
    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // 인과관계 체인 탐지 (AI 추론의 핵심)
  async detectCausalChain(chronologicalEvents) {
    const causalChain = [];
    const correlationWindow = 300000; // 5분 윈도우

    for (let i = 0; i < chronologicalEvents.length; i++) {
      const currentEvent = chronologicalEvents[i];
      const relatedEvents = this.findRelatedEvents(currentEvent, chronologicalEvents, correlationWindow);
      
      if (relatedEvents.length > 0) {
        const chainSegment = {
          trigger_event: currentEvent,
          cascading_effects: relatedEvents,
          causal_relationship: await this.analyzeCausalRelationship(currentEvent, relatedEvents),
          confidence_score: this.calculateConfidenceScore(currentEvent, relatedEvents),
          timeline_position: i
        };
        
        causalChain.push(chainSegment);
      }
    }

    return this.optimizeCausalChain(causalChain);
  }

  // 인과관계 분석 (AI 추론)
  async analyzeCausalRelationship(triggerEvent, effects) {
    const relationships = [];
    
    // 서버 간 의존성 기반 분석
    if (triggerEvent.server_id.includes('db-') && effects.some(e => e.server_id.includes('web-'))) {
      relationships.push({
        type: 'database_dependency',
        explanation: '데이터베이스 서버 문제가 웹 서버 성능에 영향을 미쳤습니다.',
        confidence: 0.9
      });
    }

    // 네트워크 전파 패턴 분석
    if (triggerEvent.event_type === 'network_latency' && 
        effects.some(e => e.event_type === 'connection_timeout')) {
      relationships.push({
        type: 'network_propagation',
        explanation: '네트워크 지연이 연결 타임아웃으로 확산되었습니다.',
        confidence: 0.85
      });
    }

    // 리소스 경쟁 패턴 분석
    if (triggerEvent.event_type === 'high_cpu' && 
        effects.some(e => e.event_type === 'memory_pressure')) {
      relationships.push({
        type: 'resource_competition',
        explanation: 'CPU 과부하로 인한 메모리 압박이 발생했습니다.',
        confidence: 0.8
      });
    }

    return relationships;
  }

  // 비즈니스 영향도 계산
  calculateBusinessImpact(causalChain) {
    let totalImpact = 0;
    const affectedServices = new Set();
    const impactMetrics = {
      service_availability: 100,
      response_time_degradation: 0,
      transaction_failure_rate: 0,
      user_experience_score: 100
    };

    causalChain.forEach(segment => {
      // 영향받은 서비스 식별
      affectedServices.add(segment.trigger_event.server_id);
      segment.cascading_effects.forEach(effect => {
        affectedServices.add(effect.server_id);
      });

      // 영향도 점수 계산
      if (segment.trigger_event.severity === 'critical') {
        totalImpact += 30;
        impactMetrics.service_availability -= 15;
      } else if (segment.trigger_event.severity === 'warning') {
        totalImpact += 10;
        impactMetrics.response_time_degradation += 10;
      }
    });

    return {
      total_impact_score: Math.min(totalImpact, 100),
      affected_services: Array.from(affectedServices),
      metrics: impactMetrics,
      estimated_revenue_impact: this.estimateRevenueImpact(totalImpact),
      user_impact_assessment: this.assessUserImpact(impactMetrics)
    };
  }

  // 더미 데이터 연동 (시연용)
  async collectTimeSeriesData(startTime, endTime) {
    // 실제로는 DataSourceAdapter를 통해 데이터 수집
    // 시연용으로는 더미 데이터 생성
    const dummyGenerator = new (await import('../utils/DummyDataGenerator.js')).DummyDataGenerator();
    return dummyGenerator.generateTimeSeriesForPeriod(startTime, endTime);
  }

  // 유틸리티 메서드들
  detectAnomaliesInDataPoint(dataPoint, serverId) {
    const anomalies = [];
    const metrics = dataPoint.metrics;

    if (metrics.cpu && metrics.cpu.usage_percent > 85) {
      anomalies.push({
        type: 'high_cpu',
        severity: metrics.cpu.usage_percent > 95 ? 'critical' : 'warning',
        description: `CPU 사용률 ${metrics.cpu.usage_percent.toFixed(1)}% 임계치 초과`,
        potential_causes: ['high_traffic', 'inefficient_process', 'resource_leak']
      });
    }

    if (metrics.memory && metrics.memory.usage_percent > 90) {
      anomalies.push({
        type: 'memory_pressure',
        severity: 'critical',
        description: `메모리 사용률 ${metrics.memory.usage_percent.toFixed(1)}% 위험 수준`,
        potential_causes: ['memory_leak', 'large_dataset', 'buffer_overflow']
      });
    }

    return anomalies;
  }

  findRelatedEvents(currentEvent, allEvents, windowMs) {
    const currentTime = new Date(currentEvent.timestamp);
    return allEvents.filter(event => {
      const eventTime = new Date(event.timestamp);
      const timeDiff = Math.abs(eventTime - currentTime);
      return timeDiff <= windowMs && event !== currentEvent;
    });
  }

  calculateConfidenceScore(triggerEvent, relatedEvents) {
    let confidence = 0.5; // 기본 신뢰도
    
    // 시간적 근접성
    const avgTimeDiff = relatedEvents.reduce((sum, event) => {
      return sum + Math.abs(new Date(event.timestamp) - new Date(triggerEvent.timestamp));
    }, 0) / relatedEvents.length;
    
    if (avgTimeDiff < 60000) confidence += 0.3; // 1분 이내
    else if (avgTimeDiff < 300000) confidence += 0.2; // 5분 이내
    
    // 서버 간 의존성
    const hasLogicalDependency = this.checkServerDependency(triggerEvent.server_id, 
      relatedEvents.map(e => e.server_id));
    if (hasLogicalDependency) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  checkServerDependency(serverId1, serverIds) {
    // 논리적 의존성 체크 (DB → Web, Web → Cache 등)
    const dependencies = {
      'db-': ['web-', 'api-'],
      'web-': ['cache-', 'cdn-'],
      'k8s-master': ['k8s-worker']
    };
    
    for (const [prefix, dependents] of Object.entries(dependencies)) {
      if (serverId1.startsWith(prefix)) {
        return serverIds.some(id => dependents.some(dep => id.startsWith(dep)));
      }
    }
    
    return false;
  }
  
  // 이벤트 전파 패턴 분석
  analyzePropagationPattern(causalChain) {
    if (causalChain.length === 0) return { pattern: 'none', flow: [] };
    
    const flow = causalChain.map(segment => segment.trigger_event.server_id);
    
    // 전파 패턴 카테고리 탐지
    let pattern = 'random';
    
    // 계층적 전파 (예: DB → App → Web)
    const tiers = ['db-', 'cache-', 'app-', 'api-', 'web-'];
    const tierFlow = flow.map(server => {
      for (let i = 0; i < tiers.length; i++) {
        if (server.startsWith(tiers[i])) return i;
      }
      return -1;
    }).filter(tier => tier !== -1);
    
    if (tierFlow.length > 1 && this.isMonotonic(tierFlow)) {
      pattern = 'tiered_propagation';
    }
    
    // 방사형 전파 (중앙 → 여러 노드)
    const uniqueServers = new Set(flow);
    if (uniqueServers.size > 3 && uniqueServers.size / flow.length > 0.7) {
      pattern = 'radial_propagation';
    }
    
    return {
      pattern,
      flow,
      affected_tiers: this.getAffectedTiers(flow)
    };
  }
  
  isMonotonic(array) {
    let increasing = true;
    let decreasing = true;
    
    for (let i = 1; i < array.length; i++) {
      increasing = increasing && array[i] >= array[i - 1];
      decreasing = decreasing && array[i] <= array[i - 1];
    }
    
    return increasing || decreasing;
  }
  
  getAffectedTiers(serverIds) {
    const tiers = {
      'database': 0,
      'cache': 0,
      'application': 0,
      'api': 0,
      'web': 0,
      'kubernetes': 0
    };
    
    serverIds.forEach(id => {
      if (id.includes('db-')) tiers.database++;
      else if (id.includes('cache-')) tiers.cache++;
      else if (id.includes('app-')) tiers.application++;
      else if (id.includes('api-')) tiers.api++;
      else if (id.includes('web-')) tiers.web++;
      else if (id.includes('k8s-')) tiers.kubernetes++;
    });
    
    return tiers;
  }
  
  // 근본 원인 가설 생성
  generateRootCauseHypotheses(initialEvent, propagationPattern) {
    const hypotheses = [];
    
    // 이벤트 유형별 가설
    if (initialEvent.event_type === 'high_cpu') {
      hypotheses.push({
        category: 'resource_exhaustion',
        technical_explanation: 'CPU 부하 증가로 인한 자원 소진',
        confidence: 0.85,
        probable_triggers: ['traffic_spike', 'inefficient_query', 'background_job'],
        immediate_fix: '리소스 증설 또는 부하 분산'
      });
    } else if (initialEvent.event_type === 'memory_pressure') {
      hypotheses.push({
        category: 'memory_leak',
        technical_explanation: '메모리 누수로 인한 점진적 자원 소진',
        confidence: 0.9,
        probable_triggers: ['application_bug', 'memory_fragmentation'],
        immediate_fix: '프로세스 재시작 및 메모리 프로파일링'
      });
    } else if (initialEvent.event_type === 'network_latency') {
      hypotheses.push({
        category: 'network_congestion',
        technical_explanation: '네트워크 혼잡으로 인한 지연 발생',
        confidence: 0.8,
        probable_triggers: ['bandwidth_saturation', 'dns_issues', 'routing_problems'],
        immediate_fix: '네트워크 트래픽 최적화 및 라우팅 조정'
      });
    }
    
    // 서버 유형별 가설
    if (initialEvent.server_id.includes('db-')) {
      hypotheses.push({
        category: 'database_bottleneck',
        technical_explanation: '데이터베이스 병목 현상',
        confidence: 0.75,
        probable_triggers: ['slow_query', 'index_missing', 'lock_contention'],
        immediate_fix: '쿼리 최적화 및 인덱스 개선'
      });
    } else if (initialEvent.server_id.includes('k8s-')) {
      hypotheses.push({
        category: 'kubernetes_issue',
        technical_explanation: '쿠버네티스 클러스터 문제',
        confidence: 0.7,
        probable_triggers: ['pod_scheduling', 'etcd_consistency', 'resource_limits'],
        immediate_fix: '문제 파드 식별 및 재배포'
      });
    }
    
    return hypotheses;
  }
  
  // 가장 가능성 높은 근본 원인 선택
  selectMostLikelyRootCause(hypotheses) {
    if (hypotheses.length === 0) return null;
    
    // 신뢰도가 가장 높은 가설 선택
    return hypotheses.reduce((best, current) => {
      return (current.confidence > best.confidence) ? current : best;
    }, hypotheses[0]);
  }
  
  // 근본 원인 신뢰도 계산
  calculateRootCauseConfidence(rootCause, causalChain) {
    if (!rootCause) return 0;
    
    let confidence = rootCause.confidence;
    
    // 이벤트 체인 길이가 길수록 신뢰도 감소
    confidence *= Math.max(0.5, 1 - (causalChain.length * 0.05));
    
    return Math.min(confidence, 1.0);
  }
  
  // 근본 원인 지지 증거 수집
  gatherSupportingEvidence(rootCause, causalChain) {
    if (!rootCause || causalChain.length === 0) return [];
    
    const evidence = [];
    
    // 카테고리별 증거 수집
    switch (rootCause.category) {
      case 'resource_exhaustion':
        evidence.push(
          '지속적인 CPU 사용률 증가 패턴',
          '이벤트 발생 전 점진적인 부하 증가'
        );
        break;
      case 'memory_leak':
        evidence.push(
          '메모리 사용량 선형적 증가',
          '재시작 후 정상화 패턴'
        );
        break;
      case 'network_congestion':
        evidence.push(
          '네트워크 지연 시간 급증',
          '패킷 손실 증가'
        );
        break;
    }
    
    // 사건 체인에서 증거 추출
    causalChain.forEach(segment => {
      if (segment.trigger_event.event_type === 'high_cpu' && rootCause.category === 'resource_exhaustion') {
        evidence.push(`${segment.trigger_event.server_id}의 CPU 사용률 ${segment.trigger_event.metric_values.cpu.usage_percent}% 관측`);
      } else if (segment.trigger_event.event_type === 'memory_pressure' && rootCause.category === 'memory_leak') {
        evidence.push(`${segment.trigger_event.server_id}의 메모리 사용률 ${segment.trigger_event.metric_values.memory.usage_percent}% 관측`);
      }
    });
    
    return evidence;
  }
  
  // 교훈 생성
  generateLessonsLearned(analysis) {
    if (!analysis.root_cause_analysis?.primary_root_cause) return [];
    
    const rootCause = analysis.root_cause_analysis.primary_root_cause;
    const lessons = [];
    
    // 근본 원인 카테고리별 교훈
    switch (rootCause.category) {
      case 'resource_exhaustion':
        lessons.push(
          '자원 모니터링 임계치 조정 필요',
          '자동 스케일링 정책 검토',
          '부하 테스트를 통한 용량 계획 수립'
        );
        break;
      case 'memory_leak':
        lessons.push(
          '정기적인 메모리 프로파일링 필요',
          '애플리케이션 재시작 정책 수립',
          '메모리 사용량 지표 모니터링 강화'
        );
        break;
      case 'database_bottleneck':
        lessons.push(
          '쿼리 최적화 및 인덱싱 전략 재검토',
          'DB 성능 모니터링 강화',
          '읽기/쓰기 분리 고려'
        );
        break;
    }
    
    return lessons;
  }
  
  // 예방 계획 생성
  generatePreventionPlan(analysis) {
    if (!analysis.root_cause_analysis?.primary_root_cause) return [];
    
    const rootCause = analysis.root_cause_analysis.primary_root_cause;
    const recommendations = [];
    
    // 단기 조치
    switch (rootCause.category) {
      case 'resource_exhaustion':
        recommendations.push({
          timeline: 'short_term',
          description: '서버 자원 증설 또는 부하 분산',
          priority: 'high'
        });
        break;
      case 'memory_leak':
        recommendations.push({
          timeline: 'short_term',
          description: '메모리 누수 디버깅 및 패치 적용',
          priority: 'high'
        });
        break;
      case 'database_bottleneck':
        recommendations.push({
          timeline: 'short_term',
          description: '문제 쿼리 최적화 및 인덱스 조정',
          priority: 'high'
        });
        break;
    }
    
    // 장기 조치
    recommendations.push({
      timeline: 'long_term',
      description: '유사 장애 방지를 위한 모니터링 강화',
      priority: 'medium'
    });
    
    recommendations.push({
      timeline: 'long_term',
      description: '자동화된 장애 대응 프로세스 구축',
      priority: 'medium'
    });
    
    return recommendations;
  }
  
  // 예상 매출 영향 추정
  estimateRevenueImpact(totalImpact) {
    // 실제로는 비즈니스 데이터 기반 계산
    // 시연용 더미 로직
    if (totalImpact > 80) return '심각 (추정 10% 이상 매출 손실)';
    if (totalImpact > 50) return '상당함 (추정 5-10% 매출 손실)';
    if (totalImpact > 20) return '경미함 (추정 1-5% 매출 손실)';
    return '미미함 (추정 1% 미만 매출 손실)';
  }
  
  // 사용자 영향 평가
  assessUserImpact(impactMetrics) {
    const availability = impactMetrics.service_availability;
    const responseTime = impactMetrics.response_time_degradation;
    
    if (availability < 70) return '심각한 서비스 중단으로 대부분의 사용자 영향받음';
    if (availability < 90) return '상당한 서비스 저하로 많은 사용자 영향받음';
    if (responseTime > 50) return '서비스 응답 시간 지연으로 사용자 경험 저하';
    return '일부 사용자만 영향받은 경미한 서비스 지연';
  }
  
  // 인과관계 체인 최적화
  optimizeCausalChain(causalChain) {
    if (causalChain.length <= 1) return causalChain;
    
    // 중복 이벤트 제거
    const uniqueChain = [];
    const eventIds = new Set();
    
    causalChain.forEach(segment => {
      const eventId = `${segment.trigger_event.server_id}:${segment.trigger_event.event_type}`;
      if (!eventIds.has(eventId)) {
        eventIds.add(eventId);
        uniqueChain.push(segment);
      }
    });
    
    // 신뢰도 기반 정렬
    uniqueChain.sort((a, b) => {
      // 우선 시간순
      const timeA = new Date(a.trigger_event.timestamp);
      const timeB = new Date(b.trigger_event.timestamp);
      
      if (timeA - timeB !== 0) return timeA - timeB;
      
      // 동일 시간이면 신뢰도순
      return b.confidence_score - a.confidence_score;
    });
    
    return uniqueChain;
  }

  // 새로 추가된 유틸리티 메서드들
  calculateDuration(start, end) {
    const diffMs = new Date(end) - new Date(start);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  }

  translateEventType(eventType) {
    const translations = {
      'high_cpu': 'CPU 사용률 과부하',
      'memory_pressure': '메모리 부족',
      'disk_full': '디스크 용량 부족',
      'network_latency': '네트워크 지연',
      'connection_timeout': '연결 타임아웃',
      'service_unavailable': '서비스 중단'
    };
    return translations[eventType] || eventType;
  }

  generateSymptomDescription(type, servers, events) {
    const serverCount = servers.length;
    const eventCount = events.length;
    const eventType = this.translateEventType(type);
    
    if (serverCount === 1) {
      return `${servers[0]} 서버에서 ${eventType} 현상이 ${eventCount}회 발생`;
    } else {
      return `${serverCount}대 서버에서 ${eventType} 현상이 총 ${eventCount}회 발생`;
    }
  }

  classifySystemType(serverId) {
    if (serverId.includes('k8s-')) return 'Kubernetes';
    if (serverId.includes('db-')) return 'Database';
    if (serverId.includes('web-')) return 'Web Server';
    if (serverId.includes('cache-')) return 'Cache';
    if (serverId.includes('api-')) return 'API';
    if (serverId.includes('app-')) return 'Application';
    return 'Unknown';
  }

  getSystemCriticality(systemType) {
    const criticalityMap = {
      'Database': 'critical',
      'Kubernetes': 'high',
      'API': 'high',
      'Application': 'medium',
      'Web Server': 'medium',
      'Cache': 'low'
    };
    return criticalityMap[systemType] || 'medium';
  }

  analyzePropagationPath(whatHappened) {
    const allServers = [];
    const allSymptoms = [];
    
    whatHappened.forEach(incident => {
      incident.primary_symptoms.forEach(symptom => {
        allSymptoms.push({
          type: symptom.type,
          servers: symptom.affected_servers,
          time: incident.timeframe.split(' ~ ')[0]
        });
        allServers.push(...symptom.affected_servers);
      });
    });
    
    // 시간순으로 정렬
    allSymptoms.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    return allSymptoms.map(symptom => ({
      time: symptom.time,
      symptom_type: symptom.type,
      servers: symptom.servers
    }));
  }
  
  inferImmediateCause(firstSymptom) {
    // 직접적 원인 추론
    const symptomCauses = {
      'CPU 사용률 과부하': {
        cause: 'CPU 자원 경쟁',
        explanation: '고부하 프로세스로 인한 CPU 사용률 급증'
      },
      '메모리 부족': {
        cause: '메모리 리소스 고갈',
        explanation: '메모리 사용량이 물리적 한계에 도달'
      },
      '네트워크 지연': {
        cause: '네트워크 혼잡',
        explanation: '과도한 트래픽 또는 네트워크 구성 문제'
      }
    };
    
    return symptomCauses[firstSymptom.type] || {
      cause: '시스템 리소스 이상',
      explanation: '정확한 원인 추가 조사 필요'
    };
  }
  
  identifyContributingFactors(whatHappened) {
    const factors = [];
    
    // 다양한 증상 유형 분석
    const symptomTypes = new Set();
    whatHappened.forEach(incident => {
      incident.primary_symptoms.forEach(symptom => {
        symptomTypes.add(symptom.type);
      });
    });
    
    // 동시다발적 증상이 있는 경우
    if (symptomTypes.size > 1) {
      factors.push({
        factor: '복합 이벤트 발생',
        significance: 'high',
        explanation: `${symptomTypes.size}가지 유형의 증상이 동시다발적으로 발생`
      });
    }
    
    // 증상 지속 시간이 긴 경우
    const longestIncident = whatHappened.reduce((longest, current) => {
      const currentDuration = this.parseDuration(current.duration);
      const longestDuration = longest ? this.parseDuration(longest.duration) : 0;
      return currentDuration > longestDuration ? current : longest;
    }, null);
    
    if (longestIncident && this.parseDuration(longestIncident.duration) > 30) {
      factors.push({
        factor: '장기 지속성 이벤트',
        significance: 'medium',
        explanation: `가장 긴 장애가 ${longestIncident.duration} 동안 지속됨`
      });
    }
    
    return factors;
  }
  
  parseDuration(durationString) {
    // "2시간 30분" 또는 "45분" 형식의 문자열에서 분 단위로 변환
    const hourMatch = durationString.match(/(\d+)시간/);
    const minuteMatch = durationString.match(/(\d+)분/);
    
    let totalMinutes = 0;
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);
    
    return totalMinutes;
  }
  
  calculateHypothesisConfidence(rootCauseAnalysis) {
    if (!rootCauseAnalysis.underlying_cause) return 0;
    
    let confidence = rootCauseAnalysis.underlying_cause.confidence || 0.5;
    
    // 여러 요인 존재 시 신뢰도 감소
    if (rootCauseAnalysis.contributing_factors.length > 1) {
      confidence *= 0.9;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  generateDefaultImmediateActions(analysis) {
    const actions = [];
    
    // 영향받은 시스템 기반 기본 조치
    if (analysis.where_occurred && analysis.where_occurred.affected_systems) {
      analysis.where_occurred.affected_systems.forEach(system => {
        switch (system.type) {
          case 'Database':
            actions.push('데이터베이스 연결 풀 재설정');
            actions.push('긴 트랜잭션 확인 및 롤백 검토');
            break;
          case 'Web Server':
            actions.push('웹 서버 프로세스 재시작');
            actions.push('로드 밸런서 상태 확인');
            break;
          case 'Kubernetes':
            actions.push('문제 파드 재시작');
            actions.push('노드 상태 확인');
            break;
        }
      });
    }
    
    // 기본 대응 조치
    if (actions.length === 0) {
      actions.push('영향받은 서비스 상태 점검');
      actions.push('문제 서버 재부팅 고려');
      actions.push('추가 모니터링 강화');
    }
    
    return actions;
  }
}

// 이벤트 상관관계 분석기
class EventCorrelator {
  correlateEvents(events) {
    // 이벤트 간 상관관계 분석 로직
    return [];
  }
}

// 인과관계 체인 탐지기
class CausalChainDetector {
  detectCausalChains(correlatedEvents) {
    // 인과관계 체인 탐지 로직
    return [];
  }
}

// 더미 클래스 (실제 구현에서는 교체)
class DummyDataGenerator {
  generateTimeSeriesForPeriod(startTime, endTime) {
    // 더미 타임시리즈 생성 로직
    return {};
  }
}

// 시간 분석 리포트 생성기
class AutoReportGenerator {
  generateReport(analysis) {
    // 리포트 생성 로직
    return {};
  }
}

// 운영 지식베이스 (별도 파일로 구현됨)
class OperationalKnowledgeBase {
  constructor() {
    // 실제 구현은 별도 파일에 있음
  }
} 