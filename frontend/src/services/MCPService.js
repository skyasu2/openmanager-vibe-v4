import axios from 'axios';
import { DataSourceAdapter } from './DataSourceAdapter.js';
import { ProductionAnalyzer } from './ProductionAnalyzer.js';
import { MONITORING_CONFIG } from '../config/monitoring.config.js';
import { TimelineAnalyzer } from './TimelineAnalyzer.js';
import { AutoReportGenerator } from './AutoReportGenerator.js';

// MCP 서버 URL 설정
const MCP_URL = process.env.REACT_APP_MCP_URL || 'https://mcp-server.onrender.com';

/**
 * MCP 서버 관련 서비스
 */
export class MCPService {
  constructor(config = MONITORING_CONFIG) {
    this.config = config;
    this.dataSource = new DataSourceAdapter(config.dataSource);
    this.analyzer = new ProductionAnalyzer(config);
    this.queryProcessor = new NaturalLanguageProcessor();
    this.conversationHistory = [];
    this.alertSuppression = new Map();
    this.timelineAnalyzer = new TimelineAnalyzer();
  }

  /**
   * 자연어 질의를 통해 서버 정보 분석
   * @param {string} query - 자연어 질의 문자열
   * @returns {Promise<Object>} - MCP 응답 객체
   */
  async processQuery(query) {
    const startTime = Date.now();
    
    try {
      // 질의 의도 분류
      const queryContext = this.analyzeQuery(query);
      
      // 시간순 분석 질의 감지
      if (query.includes("시간순") || query.includes("언제") || query.includes("순서") || 
          query.includes("1시간") || query.includes("타임라인") || query.includes("장애 발생")) {
        const result = await this.processTimelineAnalysis(query);
        result.processing_time = Date.now() - startTime;
        result.query_id = this.generateQueryId();
        this.logQuery(query, result);
        return result;
      }
      
      // 기존 로직 유지
      switch (queryContext.intent) {
        case 'server_health_check':
          return await this.handleHealthQuery(queryContext);
        case 'anomaly_investigation':
          return await this.handleAnomalyQuery(queryContext);
        case 'performance_analysis':
          return await this.handlePerformanceQuery(queryContext);
        case 'troubleshooting_guide':
          return await this.handleTroubleshootingQuery(queryContext);
        case 'capacity_planning':
          return await this.handleCapacityQuery(queryContext);
        default:
          return await this.handleGeneralQuery(queryContext);
      }
    } catch (error) {
      return this.handleQueryError(error, query);
    }
  }

  // 서버 헬스 체크 질의 처리
  async handleHealthQuery(context) {
    const servers = context.servers || await this.dataSource.getServerList();
    const healthReports = [];
    
    for (const serverId of servers) {
      const metrics = await this.dataSource.getServerMetrics(serverId);
      const analysis = await this.analyzer.analyzeServerHealth(metrics, 
        await this.getHistoricalData(serverId, '24h'));
      
      healthReports.push({
        server_id: serverId,
        health_score: analysis.health_score,
        status: this.determineServerStatus(analysis.health_score),
        critical_alerts: analysis.alerts.filter(a => a.severity === 'critical'),
        summary: this.generateHealthSummary(analysis)
      });
    }

    return {
      type: 'health_report',
      servers: healthReports,
      overall_status: this.calculateOverallHealth(healthReports),
      response: this.generateHealthResponse(healthReports, context.query),
      recommendations: this.generateSystemRecommendations(healthReports)
    };
  }

  // 이상 현상 조사 질의 처리
  async handleAnomalyQuery(context) {
    const targetServers = context.servers || await this.identifyProblematicServers();
    const investigation = {
      findings: [],
      root_cause_analysis: null,
      impact_assessment: null,
      remediation_steps: []
    };

    for (const serverId of targetServers) {
      const metrics = await this.dataSource.getServerMetrics(serverId);
      const historical = await this.getHistoricalData(serverId, '6h');
      const analysis = await this.analyzer.analyzeServerHealth(metrics, historical);
      
      if (analysis.anomalies.length > 0) {
        const rootCause = this.analyzer.performRootCauseAnalysis(metrics, targetServers);
        investigation.findings.push({
          server_id: serverId,
          anomalies: analysis.anomalies,
          root_cause: rootCause
        });
      }
    }

    // 통합 분석
    investigation.root_cause_analysis = this.performCrossServerAnalysis(investigation.findings);
    investigation.impact_assessment = this.assessBusinessImpact(investigation.findings);
    investigation.remediation_steps = this.generateRemediationPlan(investigation);

    return {
      type: 'anomaly_investigation',
      investigation,
      response: this.generateInvestigationResponse(investigation, context.query),
      priority: this.calculatePriority(investigation),
      estimated_resolution_time: this.estimateResolutionTime(investigation)
    };
  }

  // 실제 기업에서 필요한 성능 분석
  async handlePerformanceQuery(context) {
    const timeRange = context.timeRange || '1h';
    const metrics = context.metrics || ['cpu', 'memory', 'disk', 'network'];
    
    const performanceData = {};
    const servers = context.servers || await this.dataSource.getServerList();
    
    for (const serverId of servers) {
      const currentMetrics = await this.dataSource.getServerMetrics(serverId, timeRange);
      const baselineMetrics = await this.getHistoricalData(serverId, '7d');
      
      performanceData[serverId] = {
        current: currentMetrics,
        baseline: this.calculateBaseline(baselineMetrics),
        performance_delta: this.calculatePerformanceDelta(currentMetrics, baselineMetrics),
        trend_analysis: this.analyzeTrends(baselineMetrics),
        bottlenecks: this.identifyBottlenecks(currentMetrics)
      };
    }

    return {
      type: 'performance_analysis',
      data: performanceData,
      response: this.generatePerformanceResponse(performanceData, context.query),
      optimization_opportunities: this.identifyOptimizationOpportunities(performanceData),
      capacity_recommendations: this.generateCapacityRecommendations(performanceData)
    };
  }

  // 기업 환경에서 중요한 트러블슈팅 가이드
  async handleTroubleshootingQuery(context) {
    const problemDescription = context.problem || context.query;
    const affectedServers = context.servers || await this.identifyAffectedServers(problemDescription);
    
    const troubleshootingPlan = {
      immediate_steps: [],
      diagnostic_commands: [],
      escalation_criteria: [],
      rollback_plan: []
    };

    // 문제 유형별 트러블슈팅 로직
    const problemType = this.classifyProblem(problemDescription);
    
    switch (problemType) {
      case 'high_cpu':
        troubleshootingPlan.immediate_steps = [
          'top 명령어로 CPU 사용률이 높은 프로세스 확인',
          'htop으로 프로세스별 리소스 사용량 분석',
          '필요시 부하가 높은 프로세스 재시작 검토'
        ];
        troubleshootingPlan.diagnostic_commands = [
          'top -p $(pgrep -d"," -f your_application)',
          'iostat -x 1 5',
          'vmstat 1 5'
        ];
        break;
      
      case 'memory_issue':
        troubleshootingPlan.immediate_steps = [
          '메모리 사용량이 높은 프로세스 식별',
          'swap 사용량 확인',
          '메모리 리크 패턴 분석'
        ];
        troubleshootingPlan.diagnostic_commands = [
          'ps aux --sort=-%mem | head -20',
          'free -h',
          'cat /proc/meminfo'
        ];
        break;
      
      case 'network_issue':
        troubleshootingPlan.immediate_steps = [
          '네트워크 연결성 확인',
          'DNS 해상도 테스트',
          '포트 연결 상태 확인'
        ];
        troubleshootingPlan.diagnostic_commands = [
          'ping -c 4 target_host',
          'nslookup target_host',
          'netstat -tulpn | grep :port'
        ];
        break;
    }

    return {
      type: 'troubleshooting_guide',
      problem_type: problemType,
      affected_servers: affectedServers,
      plan: troubleshootingPlan,
      response: this.generateTroubleshootingResponse(troubleshootingPlan, context.query),
      escalation_contacts: this.getEscalationContacts(problemType),
      knowledge_base_links: this.getRelevantKBArticles(problemType)
    };
  }

  // 용량 계획 질의 처리
  async handleCapacityQuery(context) {
    const timeRange = context.timeRange || '30d';
    const resourceTypes = context.resourceTypes || ['cpu', 'memory', 'disk', 'network'];
    const forecastHorizon = context.forecastHorizon || '90d';
    
    const capacityData = {};
    const servers = context.servers || await this.dataSource.getServerList();
    
    for (const serverId of servers) {
      const historicalData = await this.getHistoricalData(serverId, timeRange);
      
      capacityData[serverId] = {
        current_usage: this.getCurrentUsage(historicalData),
        growth_trends: this.calculateGrowthTrends(historicalData, resourceTypes),
        forecast: this.generateCapacityForecast(historicalData, resourceTypes, forecastHorizon),
        bottlenecks: this.predictResourceBottlenecks(historicalData, forecastHorizon)
      };
    }
    
    // 시스템 전체 용량 계획
    const systemWideCapacityPlan = this.generateSystemWideCapacityPlan(capacityData, forecastHorizon);
    
    return {
      type: 'capacity_planning',
      data: capacityData,
      system_plan: systemWideCapacityPlan,
      response: this.generateCapacityResponse(capacityData, systemWideCapacityPlan, context.query),
      resource_recommendations: this.generateResourceRecommendations(capacityData),
      cost_estimates: this.estimateUpgradeCosts(systemWideCapacityPlan)
    };
  }

  // 일반 질의 처리
  async handleGeneralQuery(context) {
    // 의도를 파악할 수 없는 질의에 대한 기본 응답
    const systemOverview = await this.getSystemOverview();
    
    return {
      type: 'general_response',
      system_overview: systemOverview,
      response: this.generateGeneralResponse(context.query, systemOverview),
      suggested_queries: this.suggestFollowUpQueries(context.query, systemOverview)
    };
  }

  // 실제 기업에서 사용되는 유틸리티 메서드들
  determineServerStatus(healthScore) {
    if (healthScore >= 90) return 'healthy';
    if (healthScore >= 70) return 'warning';
    if (healthScore >= 50) return 'critical';
    return 'down';
  }

  calculateOverallHealth(healthReports) {
    const avgHealth = healthReports.reduce((sum, report) => sum + report.health_score, 0) / healthReports.length;
    const criticalCount = healthReports.filter(r => r.status === 'critical' || r.status === 'down').length;
    
    return {
      average_health_score: avgHealth,
      healthy_servers: healthReports.filter(r => r.status === 'healthy').length,
      warning_servers: healthReports.filter(r => r.status === 'warning').length,
      critical_servers: criticalCount,
      overall_status: criticalCount > 0 ? 'attention_required' : avgHealth >= 80 ? 'good' : 'needs_attention'
    };
  }

  generateHealthResponse(healthReports, originalQuery) {
    const overall = this.calculateOverallHealth(healthReports);
    let response = "";

    if (overall.overall_status === 'good') {
      response = `전체적으로 시스템 상태가 양호합니다. ${overall.healthy_servers}개 서버가 정상 동작 중입니다.`;
    } else if (overall.critical_servers > 0) {
      response = `⚠️ 주의가 필요합니다. ${overall.critical_servers}개 서버에서 심각한 문제가 발견되었습니다.`;
      
      const criticalServers = healthReports.filter(r => r.status === 'critical' || r.status === 'down');
      response += "\n\n**문제 서버:**\n";
      criticalServers.forEach(server => {
        response += `- ${server.server_id}: ${server.summary}\n`;
      });
    }

    return response;
  }

  async identifyProblematicServers() {
    // 문제가 있는 서버 식별
    const servers = await this.dataSource.getServerList();
    const problematicServers = [];
    
    for (const serverId of servers) {
      const metrics = await this.dataSource.getServerMetrics(serverId);
      const analysis = await this.analyzer.analyzeServerHealth(metrics, []);
      
      if (analysis.health_score < 80 || analysis.alerts.length > 0 || analysis.anomalies.length > 0) {
        problematicServers.push(serverId);
      }
    }
    
    return problematicServers.length > 0 ? problematicServers : [servers[0]]; // 최소 하나는 반환
  }

  performCrossServerAnalysis(findings) {
    // 여러 서버 간 상관관계 분석
    if (!findings || findings.length === 0) return null;
    
    const correlations = [];
    const commonAnomalies = this.findCommonAnomalies(findings);
    const timingPatterns = this.analyzeTimingPatterns(findings);
    
    return {
      correlated_servers: this.identifyCorrelatedServers(findings),
      common_anomalies: commonAnomalies,
      timing_patterns: timingPatterns,
      probable_root_cause: this.determineMostLikelyRootCause(findings, commonAnomalies, timingPatterns)
    };
  }

  async getHistoricalData(serverId, timeRange) {
    // 실제 구현에서는 데이터 소스에서 가져옴
    // 지금은 더미 데이터 생성
    const historicalData = [];
    const hours = parseInt(timeRange) || 24;
    
    const baseMetrics = await this.dataSource.getServerMetrics(serverId);
    const now = new Date();
    
    for (let i = 0; i < hours; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - i);
      
      // 약간의 변동성 추가
      const metrics = JSON.parse(JSON.stringify(baseMetrics.metrics));
      metrics.cpu.usage_percent += (Math.random() - 0.5) * 20;
      metrics.memory.usage_percent += (Math.random() - 0.5) * 15;
      metrics.disk.usage_percent += (Math.random() - 0.5) * 10;
      
      historicalData.push({
        server_id: serverId,
        timestamp: timestamp.toISOString(),
        metrics: metrics
      });
    }
    
    return historicalData.reverse(); // 시간순 정렬
  }

  assessBusinessImpact(findings) {
    // 비즈니스 영향 평가
    if (!findings || findings.length === 0) return null;
    
    const criticalAnomalyCount = findings.reduce((count, finding) => {
      return count + finding.anomalies.filter(a => a.severity === 'critical').length;
    }, 0);
    
    const impactedServices = this.identifyImpactedServices(findings);
    
    let severity = 'low';
    if (criticalAnomalyCount > 3 || impactedServices.critical.length > 0) {
      severity = 'critical';
    } else if (criticalAnomalyCount > 0 || impactedServices.warning.length > 0) {
      severity = 'warning';
    }
    
    return {
      severity,
      impacted_services: impactedServices,
      estimated_user_impact: this.estimateUserImpact(impactedServices),
      business_metrics: this.estimateBusinessMetricsImpact(severity, impactedServices)
    };
  }

  identifyImpactedServices(findings) {
    // 실제 구현에서는 서비스 의존성 맵을 사용
    return {
      critical: ['web-server', 'auth-service'].filter(() => Math.random() > 0.7),
      warning: ['admin-panel', 'reporting-service'].filter(() => Math.random() > 0.5),
      potentially_affected: ['notification-service', 'user-profile-service'].filter(() => Math.random() > 0.3)
    };
  }

  // 에러 처리 (프로덕션에서 중요)
  handleQueryError(error, originalQuery) {
    console.error('MCPService Query Error:', error);
    
    return {
      type: 'error',
      error_code: error.code || 'UNKNOWN_ERROR',
      response: "죄송합니다. 질의 처리 중 오류가 발생했습니다. 시스템 관리자에게 문의해주세요.",
      original_query: originalQuery,
      timestamp: new Date().toISOString(),
      suggestions: [
        "질문을 다시 표현해보세요",
        "구체적인 서버명이나 시간을 명시해보세요",
        "시스템 상태를 먼저 확인해보세요"
      ]
    };
  }

  analyzeQuery(query) {
    // 실제 구현에서는 NLP 처리
    return this.queryProcessor.analyzeQuery(query);
  }
  
  generateQueryId() {
    return `query-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  
  logQuery(query, response) {
    // 실제 구현에서는 로깅 시스템 사용
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      query,
      response
    });
    
    console.log(`[MCPService] Query logged: ${query}`);
  }
  
  generateHealthSummary(analysis) {
    if (analysis.health_score >= 90) {
      return "정상 작동 중";
    } else if (analysis.health_score >= 70) {
      const issues = analysis.alerts.map(a => a.type.split('_')[0]).join(', ');
      return `${issues} 관련 주의 필요`;
    } else {
      const criticalIssues = analysis.alerts
        .filter(a => a.severity === 'critical')
        .map(a => a.type.split('_')[0])
        .join(', ');
      return `심각: ${criticalIssues} 문제 발생`;
    }
  }
  
  generateSystemRecommendations(healthReports) {
    const criticalServers = healthReports.filter(r => r.status === 'critical' || r.status === 'down');
    const recommendations = [];
    
    if (criticalServers.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'investigate_critical',
        description: `${criticalServers.length}개 서버의 심각한 문제를 즉시 조사하세요.`,
        affected_servers: criticalServers.map(s => s.server_id)
      });
    }
    
    const warningServers = healthReports.filter(r => r.status === 'warning');
    if (warningServers.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'monitor_warnings',
        description: `${warningServers.length}개 서버의 경고 상태를 모니터링하세요.`,
        affected_servers: warningServers.map(s => s.server_id)
      });
    }
    
    return recommendations;
  }
  
  generateInvestigationResponse(investigation, originalQuery) {
    const findings = investigation.findings;
    
    if (!findings || findings.length === 0) {
      return "현재 감지된 이상 징후가 없습니다.";
    }
    
    const anomalyCount = findings.reduce((count, finding) => count + finding.anomalies.length, 0);
    const serverCount = findings.length;
    
    let response = `${serverCount}개 서버에서 총 ${anomalyCount}개의 이상 징후가 감지되었습니다.\n\n`;
    
    // 근본 원인 분석 결과 추가
    if (investigation.root_cause_analysis && investigation.root_cause_analysis.probable_root_cause) {
      response += `**근본 원인 분석**: ${investigation.root_cause_analysis.probable_root_cause}\n\n`;
    }
    
    // 비즈니스 영향 추가
    if (investigation.impact_assessment) {
      response += `**비즈니스 영향**: ${investigation.impact_assessment.severity} 수준\n`;
      
      if (investigation.impact_assessment.impacted_services.critical.length > 0) {
        response += `- 심각한 영향을 받는 서비스: ${investigation.impact_assessment.impacted_services.critical.join(', ')}\n`;
      }
    }
    
    // 조치 단계 추가
    if (investigation.remediation_steps.length > 0) {
      response += "\n**권장 조치**:\n";
      investigation.remediation_steps.forEach((step, i) => {
        response += `${i+1}. ${step}\n`;
      });
    }
    
    return response;
  }
  
  generateTroubleshootingResponse(plan, originalQuery) {
    const { immediate_steps, diagnostic_commands } = plan;
    
    let response = "문제 해결을 위한 단계:\n\n";
    
    response += "**즉시 조치**:\n";
    immediate_steps.forEach((step, i) => {
      response += `${i+1}. ${step}\n`;
    });
    
    response += "\n**진단 명령어**:\n";
    diagnostic_commands.forEach((cmd, i) => {
      response += `\`${cmd}\`\n`;
    });
    
    return response;
  }
  
  getEscalationContacts(problemType) {
    // 실제 구현에서는 문제 유형별 담당자 매핑
    const contacts = {
      'high_cpu': ['system-admin@company.com', 'devops-oncall@company.com'],
      'memory_issue': ['application-team@company.com', 'devops-oncall@company.com'],
      'network_issue': ['network-team@company.com', 'infra-oncall@company.com'],
      'disk_issue': ['storage-team@company.com', 'devops-oncall@company.com']
    };
    
    return contacts[problemType] || ['support@company.com'];
  }
  
  getRelevantKBArticles(problemType) {
    // 실제 구현에서는 문제 유형별 지식 베이스 문서 매핑
    const articles = {
      'high_cpu': [
        { title: 'CPU 부하 문제 해결 가이드', url: 'https://kb.company.com/cpu-troubleshooting' },
        { title: '프로세스 분석 방법', url: 'https://kb.company.com/process-analysis' }
      ],
      'memory_issue': [
        { title: '메모리 누수 디버깅 가이드', url: 'https://kb.company.com/memory-leak-debugging' },
        { title: 'OOM 문제 해결', url: 'https://kb.company.com/oom-killer' }
      ],
      'network_issue': [
        { title: '네트워크 지연 문제 해결', url: 'https://kb.company.com/network-latency' },
        { title: 'DNS 문제 진단', url: 'https://kb.company.com/dns-troubleshooting' }
      ]
    };
    
    return articles[problemType] || [];
  }
  
  classifyProblem(description) {
    // 실제 구현에서는 ML 기반 분류
    if (description.includes('CPU') || description.includes('프로세서') || description.includes('부하')) {
      return 'high_cpu';
    } else if (description.includes('메모리') || description.includes('OOM') || description.includes('메모리 부족')) {
      return 'memory_issue';
    } else if (description.includes('네트워크') || description.includes('연결') || description.includes('지연')) {
      return 'network_issue';
    } else if (description.includes('디스크') || description.includes('저장') || description.includes('용량')) {
      return 'disk_issue';
    }
    
    return 'general_issue';
  }
  
  calculatePriority(investigation) {
    if (!investigation || !investigation.findings || investigation.findings.length === 0) {
      return 'low';
    }
    
    const criticalCount = investigation.findings.reduce((count, finding) => {
      return count + finding.anomalies.filter(a => a.severity === 'critical').length;
    }, 0);
    
    if (criticalCount > 0) return 'critical';
    
    const warningCount = investigation.findings.reduce((count, finding) => {
      return count + finding.anomalies.filter(a => a.severity === 'warning').length;
    }, 0);
    
    if (warningCount > 2) return 'high';
    if (warningCount > 0) return 'medium';
    
    return 'low';
  }
  
  estimateResolutionTime(investigation) {
    // 실제 구현에서는 과거 데이터 기반 예측
    if (!investigation || !investigation.findings || investigation.findings.length === 0) {
      return '10분';
    }
    
    const criticalCount = investigation.findings.reduce((count, finding) => {
      return count + finding.anomalies.filter(a => a.severity === 'critical').length;
    }, 0);
    
    if (criticalCount > 3) return '2시간 이상';
    if (criticalCount > 0) return '1시간';
    
    const warningCount = investigation.findings.reduce((count, finding) => {
      return count + finding.anomalies.filter(a => a.severity === 'warning').length;
    }, 0);
    
    if (warningCount > 5) return '45분';
    if (warningCount > 2) return '30분';
    
    return '15분';
  }

  /**
   * 최근 알림 목록을 가져옵니다.
   * @param {number} limit - 가져올 알림 수
   * @param {string} severity - 알림 심각도 필터 ('all', 'critical', 'warning', 'info')
   * @returns {Promise<Array>} - 알림 목록
   */
  async getRecentAlerts(limit = 5, severity = 'all') {
    try {
      // 실제 환경에서는 DataSource에서 알림 가져오기
      const alerts = await this.dataSource.getAlerts(severity);
      
      // 최대 limit 개수만큼 반환
      return alerts.slice(0, limit);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }
  
  /**
   * 자동 복구 작업 실행
   * @param {Object} alert - 알림 객체
   * @returns {Promise<Object>} - 복구 작업 결과
   */
  async executeAutoRemediation(alert) {
    console.log('Executing auto remediation for alert:', alert);
    
    // 실제 구현에서는 자동 복구 로직 실행
    return {
      success: true,
      alert_id: alert.id,
      action: 'auto_remediation',
      timestamp: new Date().toISOString(),
      details: '자동 복구 작업이 성공적으로 실행되었습니다.'
    };
  }
  
  /**
   * 알림 에스컬레이션 트리거
   * @param {Object} alert - 알림 객체
   * @returns {Promise<Object>} - 에스컬레이션 결과
   */
  async triggerEscalation(alert) {
    console.log('Triggering escalation for alert:', alert);
    
    // 실제 구현에서는 에스컬레이션 채널로 알림 전송
    return {
      success: true,
      alert_id: alert.id,
      action: 'escalation',
      timestamp: new Date().toISOString(),
      details: '알림이 담당자에게 에스컬레이션되었습니다.'
    };
  }

  /**
   * 시간순 분석 수행
   * @param {string} query - 분석 요청 질의
   * @returns {Promise<Object>} - 타임라인 분석 결과
   */
  async processTimelineAnalysis(query) {
    const timelineAnalyzer = new TimelineAnalyzer();
    
    // 질문에서 시간 범위 추출
    const timeRange = this.extractTimeRange(query) || '1h';
    const timeMs = this.convertTimeRangeToMs(timeRange);
    const startTime = new Date(Date.now() - timeMs);
    const endTime = new Date();
    
    // 시간순 분석 수행
    const analysis = await timelineAnalyzer.analyzeIncidentTimeline(startTime, endTime);
    
    // 자연어 응답 생성
    const response = this.generateTimelineResponse(analysis, query);
    
    return {
      type: 'timeline_analysis',
      response,
      analysis,
      timeline_data: analysis.causal_chain,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 시간 범위를 밀리초로 변환
   * @param {string} timeRange - 시간 범위 문자열 (예: '1h', '30m', '1d')
   * @returns {number} - 밀리초 단위 시간
   */
  convertTimeRangeToMs(timeRange) {
    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (!match) return 3600000; // 기본 1시간
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'm': return value * 60000; // 분
      case 'h': return value * 3600000; // 시간
      case 'd': return value * 86400000; // 일
      default: return 3600000; // 기본 1시간
    }
  }

  // 시간순 분석 응답 생성
  generateTimelineResponse(analysis, originalQuery) {
    if (analysis.causal_chain.length === 0) {
      return "분석 기간 동안 특별한 장애나 이상 징후가 발견되지 않았습니다. 시스템이 안정적으로 운영되었습니다.";
    }

    let response = `📊 **시간순 장애 분석 결과**\n\n`;
    
    // 요약
    response += `🔍 **분석 기간**: ${this.formatTimeRange(analysis.timeline_period)}\n`;
    response += `⚠️ **발견된 이벤트**: ${analysis.causal_chain.length}개\n\n`;
    
    // 시간순 이벤트
    response += `⏰ **시간순 이벤트 흐름**:\n`;
    analysis.causal_chain.forEach((segment, index) => {
      const time = new Date(segment.trigger_event.timestamp).toLocaleTimeString();
      response += `${index + 1}. **${time}** - ${segment.trigger_event.server_id}: ${segment.trigger_event.description}\n`;
      
      if (segment.cascading_effects.length > 0) {
        response += `   → 연쇄 영향: ${segment.cascading_effects.length}개 서버\n`;
      }
    });
    
    // 근본 원인
    if (analysis.root_cause_analysis?.primary_root_cause) {
      response += `\n🎯 **근본 원인**: ${analysis.root_cause_analysis.primary_root_cause.technical_explanation || '복합적 요인'}\n`;
    }
    
    // 비즈니스 영향
    if (analysis.business_impact) {
      response += `\n💼 **영향 평가**: 서비스 가용성 ${analysis.business_impact.metrics.service_availability}%, `;
      response += `${analysis.business_impact.affected_services.length}개 서비스 영향\n`;
    }
    
    return response;
  }

  // 시간 범위 형식화
  formatTimeRange(period) {
    if (!period || !period.start || !period.end) return '';
    
    const start = new Date(period.start).toLocaleTimeString();
    const end = new Date(period.end).toLocaleTimeString();
    return `${start} ~ ${end}`;
  }
  
  /**
   * 서버 실시간 데이터 조회
   * @returns {Promise<Object>} - 실시간 서버 데이터
   */
  async getRealtimeServerData() {
    try {
      // 모든 서버 가져오기
      const servers = await this.dataSource.getServerList();
      
      // 각 서버의 최신 메트릭 수집
      const metrics = {};
      
      for (const serverId of servers) {
        const serverMetrics = await this.dataSource.getServerMetrics(serverId);
        metrics[serverId] = serverMetrics;
        
        // 심각 알림 식별
        metrics[serverId].emergent_alerts = this.identifyEmergentAlerts(serverMetrics);
      }
      
      return {
        timestamp: new Date().toISOString(),
        metrics,
        system_status: this.calculateSystemStatus(metrics)
      };
    } catch (error) {
      console.error('Error fetching realtime server data:', error);
      return null;
    }
  }
  
  /**
   * 심각 알림 식별
   * @param {Object} serverMetrics - 서버 메트릭 데이터
   * @returns {Array} - 심각 알림 목록
   */
  identifyEmergentAlerts(serverMetrics) {
    const alerts = [];
    
    // CPU 사용률 체크
    if (serverMetrics.metrics?.cpu?.usage_percent > 90) {
      alerts.push({
        type: 'high_cpu',
        severity: 'critical',
        metric: 'cpu.usage_percent',
        value: serverMetrics.metrics.cpu.usage_percent,
        threshold: 90,
        message: `CPU 사용률 ${serverMetrics.metrics.cpu.usage_percent}% 초과`
      });
    }
    
    // 메모리 사용률 체크
    if (serverMetrics.metrics?.memory?.usage_percent > 95) {
      alerts.push({
        type: 'memory_pressure',
        severity: 'critical',
        metric: 'memory.usage_percent',
        value: serverMetrics.metrics.memory.usage_percent,
        threshold: 95,
        message: `메모리 사용률 ${serverMetrics.metrics.memory.usage_percent}% 초과`
      });
    }
    
    // 디스크 사용률 체크
    if (serverMetrics.metrics?.disk?.usage_percent > 90) {
      alerts.push({
        type: 'disk_full',
        severity: 'critical',
        metric: 'disk.usage_percent',
        value: serverMetrics.metrics.disk.usage_percent,
        threshold: 90,
        message: `디스크 사용률 ${serverMetrics.metrics.disk.usage_percent}% 초과`
      });
    }
    
    return alerts;
  }
  
  /**
   * 시스템 전체 상태 계산
   * @param {Object} metricsMap - 모든 서버 메트릭
   * @returns {string} - 시스템 상태
   */
  calculateSystemStatus(metricsMap) {
    let criticalCount = 0;
    let warningCount = 0;
    
    Object.values(metricsMap).forEach(metrics => {
      if (metrics.emergent_alerts && metrics.emergent_alerts.some(a => a.severity === 'critical')) {
        criticalCount++;
      } else if (metrics.status === 'warning') {
        warningCount++;
      }
    });
    
    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'normal';
  }
}

// 자연어 처리 클래스 (기업에서 활용 가능한 수준)
class NaturalLanguageProcessor {
  constructor() {
    this.intentPatterns = this.initializeIntentPatterns();
    this.entityExtractor = new EntityExtractor();
  }

  analyzeQuery(query) {
    return {
      intent: this.extractIntent(query),
      entities: this.entityExtractor ? this.entityExtractor.extract(query) : {},
      servers: this.extractServerReferences(query),
      timeRange: this.extractTimeRange(query),
      metrics: this.extractMetrics(query),
      urgency: this.assessUrgency(query)
    };
  }

  extractIntent(query) {
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (query.includes(pattern)) {
          return intent;
        }
      }
    }
    return 'general';
  }

  initializeIntentPatterns() {
    return {
      server_health_check: ['상태', '헬스', '정상', '문제', '어떤', '현재'],
      anomaly_investigation: ['왜', '원인', '분석', '이유', '어떻게', '조사'],
      performance_analysis: ['성능', '속도', '느린', '빠른', '처리량', '응답시간'],
      troubleshooting_guide: ['해결', '고치', '방법', '조치', '복구', '문제해결'],
      capacity_planning: ['용량', '확장', '스케일', '증설', '리소스', '계획']
    };
  }
  
  extractServerReferences(query) {
    // 실제 구현에서는 정교한 NER 사용
    const serverPatterns = [
      /k8s-master-\d+/g,
      /k8s-worker-\d+/g,
      /k8s-etcd-\d+/g,
      /web-server-\d+/g,
      /db-server-\d+/g,
      /redis-server-\d+/g,
      /monitoring-\d+/g
    ];
    
    const servers = [];
    
    for (const pattern of serverPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        servers.push(...matches);
      }
    }
    
    return servers;
  }
  
  extractTimeRange(query) {
    // 시간 범위 추출 (1h, 24h, 7d 등)
    const timeRangePattern = /(\d+)\s*(분|시간|일|주|개월|h|m|d|w)/i;
    const match = query.match(timeRangePattern);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit === '분' || unit === 'm') return `${value}m`;
    if (unit === '시간' || unit === 'h') return `${value}h`;
    if (unit === '일' || unit === 'd') return `${value}d`;
    if (unit === '주' || unit === 'w') return `${value}w`;
    if (unit === '개월') return `${value * 30}d`;
    
    return null;
  }
  
  extractMetrics(query) {
    const metricPatterns = {
      cpu: /(cpu|씨피유|프로세서|처리|연산)/i,
      memory: /(memory|메모리|ram|램|기억장치)/i,
      disk: /(disk|디스크|저장|용량|storage|스토리지)/i,
      network: /(network|네트워크|대역폭|연결|bandwidth)/i
    };
    
    const metrics = [];
    
    for (const [metric, pattern] of Object.entries(metricPatterns)) {
      if (pattern.test(query)) {
        metrics.push(metric);
      }
    }
    
    return metrics.length > 0 ? metrics : null;
  }
  
  assessUrgency(query) {
    const urgentPatterns = [
      /긴급/i, /급함/i, /즉시/i, /critical/i, /심각/i, /장애/i, 
      /중단/i, /불가능/i, /실패/i, /에러/i, /error/i, /즉각/i,
      /지금/i, /당장/i, /빨리/i
    ];
    
    for (const pattern of urgentPatterns) {
      if (pattern.test(query)) {
        return 'high';
      }
    }
    
    return 'normal';
  }
}

// 엔티티 추출기 (실제 구현 시 NER 모델 사용)
class EntityExtractor {
  extract(query) {
    // 실제 구현에서는 NER 모델 사용
    return {
      servers: [],
      metrics: [],
      time_ranges: [],
      thresholds: []
    };
  }
}

// 싱글톤 인스턴스 생성하여 내보내기
export default new MCPService(); 