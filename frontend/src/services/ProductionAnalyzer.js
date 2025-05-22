import { MONITORING_CONFIG } from '../config/monitoring.config.js';

export class ProductionAnalyzer {
  constructor(config = MONITORING_CONFIG) {
    this.config = config;
    this.thresholds = config.thresholds;
    this.rules = config.analysis_rules;
    this.alertHistory = new Map();
    this.patternCache = new Map();
  }

  // 실제 프로덕션에서 사용되는 이상 탐지 로직
  async analyzeServerHealth(serverMetrics, historicalData) {
    const analysis = {
      server_id: serverMetrics.server_id,
      timestamp: new Date().toISOString(),
      health_score: 100,
      anomalies: [],
      recommendations: [],
      alerts: []
    };

    // 1. 임계값 기반 분석 (가장 기본적이고 확실한 방법)
    const thresholdAlerts = this.checkThresholds(serverMetrics);
    analysis.alerts.push(...thresholdAlerts);

    // 2. 통계적 이상 탐지 (실제 기업에서 활용)
    const statisticalAnomalies = this.detectStatisticalAnomalies(serverMetrics, historicalData);
    analysis.anomalies.push(...statisticalAnomalies);

    // 3. 패턴 기반 분석 (머신러닝 대신 룰 기반으로 안정성 확보)
    const patternAnomalies = this.detectPatternAnomalies(serverMetrics, historicalData);
    analysis.anomalies.push(...patternAnomalies);

    // 4. 헬스 스코어 계산
    analysis.health_score = this.calculateHealthScore(analysis);

    // 5. 액션 추천
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  // 임계값 체크 (프로덕션 필수)
  checkThresholds(metrics) {
    const alerts = [];
    
    // CPU 분석
    const cpuUsage = metrics.metrics.cpu.usage_percent;
    if (cpuUsage >= this.thresholds.cpu.critical) {
      alerts.push(this.createAlert('cpu_critical', cpuUsage, 
        `CPU 사용률 ${cpuUsage.toFixed(1)}%가 임계치 ${this.thresholds.cpu.critical}%를 초과했습니다.`));
    } else if (cpuUsage >= this.thresholds.cpu.warning) {
      alerts.push(this.createAlert('cpu_warning', cpuUsage,
        `CPU 사용률 ${cpuUsage.toFixed(1)}%가 경고 수준입니다.`));
    }

    // 메모리 분석
    const memoryUsage = metrics.metrics.memory.usage_percent;
    if (memoryUsage >= this.thresholds.memory.critical) {
      alerts.push(this.createAlert('memory_critical', memoryUsage,
        `메모리 사용률 ${memoryUsage.toFixed(1)}%가 임계치를 초과했습니다.`));
    }

    // 디스크 분석
    const diskUsage = metrics.metrics.disk.usage_percent;
    if (diskUsage >= this.thresholds.disk.critical) {
      alerts.push(this.createAlert('disk_critical', diskUsage,
        `디스크 사용률 ${diskUsage.toFixed(1)}%가 임계치를 초과했습니다.`));
    }

    // 네트워크 분석
    const latency = metrics.metrics.network.latency_ms;
    if (latency >= this.thresholds.network.latency_critical) {
      alerts.push(this.createAlert('network_latency_critical', latency,
        `네트워크 지연 시간 ${latency}ms가 임계치를 초과했습니다.`));
    }

    return alerts;
  }

  // 통계적 이상 탐지 (실제 기업에서 활용되는 방법)
  detectStatisticalAnomalies(currentMetrics, historicalData) {
    const anomalies = [];
    
    if (!historicalData || historicalData.length < 10) {
      return anomalies; // 충분한 히스토리가 없으면 스킵
    }

    const metrics = ['cpu.usage_percent', 'memory.usage_percent', 'disk.usage_percent'];
    
    metrics.forEach(metricPath => {
      const currentValue = this.getNestedValue(currentMetrics.metrics, metricPath);
      const historicalValues = historicalData.map(h => this.getNestedValue(h.metrics, metricPath));
      
      const stats = this.calculateStatistics(historicalValues);
      const zScore = Math.abs((currentValue - stats.mean) / stats.stdDev);
      
      // Z-Score > 2.5면 이상치로 판단 (실제 기업에서 사용하는 기준)
      if (zScore > 2.5) {
        anomalies.push({
          type: 'statistical_anomaly',
          metric: metricPath,
          current_value: currentValue,
          expected_range: `${stats.mean - 2*stats.stdDev} ~ ${stats.mean + 2*stats.stdDev}`,
          z_score: zScore,
          severity: zScore > 3 ? 'critical' : 'warning',
          description: `${metricPath}이 평상시 패턴과 ${zScore.toFixed(2)} 표준편차만큼 벗어났습니다.`
        });
      }
    });

    return anomalies;
  }

  // 패턴 기반 이상 탐지 (실무에서 검증된 방법)
  detectPatternAnomalies(currentMetrics, historicalData) {
    const anomalies = [];

    // 1. 메모리 리크 패턴 탐지
    const memoryLeak = this.detectMemoryLeak(currentMetrics, historicalData);
    if (memoryLeak) anomalies.push(memoryLeak);

    // 2. CPU 스파이크 패턴 탐지  
    const cpuSpike = this.detectCpuSpike(currentMetrics, historicalData);
    if (cpuSpike) anomalies.push(cpuSpike);

    // 3. 디스크 I/O 병목 탐지
    const diskBottleneck = this.detectDiskBottleneck(currentMetrics);
    if (diskBottleneck) anomalies.push(diskBottleneck);

    return anomalies;
  }

  // 메모리 리크 탐지 (실제 기업에서 중요한 패턴)
  detectMemoryLeak(currentMetrics, historicalData) {
    if (!historicalData || historicalData.length < 6) return null;

    const recentMemory = historicalData.slice(-6).map(h => h.metrics.memory.usage_percent);
    const isIncreasing = this.isMonotonicIncreasing(recentMemory);
    const growthRate = this.calculateGrowthRate(recentMemory);

    if (isIncreasing && growthRate > 5) { // 시간당 5% 이상 증가
      return {
        type: 'memory_leak_pattern',
        severity: 'warning',
        growth_rate: growthRate,
        description: `메모리 사용률이 지속적으로 증가하고 있습니다 (${growthRate.toFixed(1)}%/시간). 메모리 리크 가능성이 있습니다.`,
        recommendation: '애플리케이션 메모리 프로파일링을 수행하고 메모리 리크를 확인하세요.'
      };
    }

    return null;
  }

  // CPU 스파이크 패턴 탐지
  detectCpuSpike(currentMetrics, historicalData) {
    if (!historicalData || historicalData.length < 4) return null;
    
    const currentCpu = currentMetrics.metrics.cpu.usage_percent;
    const recentCpu = historicalData.slice(-3).map(h => h.metrics.cpu.usage_percent);
    const avgRecentCpu = recentCpu.reduce((a, b) => a + b, 0) / recentCpu.length;
    
    // 갑작스러운 CPU 증가 탐지
    if (currentCpu > avgRecentCpu * 2 && currentCpu > 70) {
      return {
        type: 'cpu_spike_pattern',
        severity: 'warning',
        current_value: currentCpu,
        avg_recent: avgRecentCpu,
        spike_ratio: (currentCpu / avgRecentCpu).toFixed(1),
        description: `CPU 사용률이 평소 대비 ${(currentCpu / avgRecentCpu).toFixed(1)}배 급증했습니다. 갑작스러운 부하가 발생했을 수 있습니다.`,
        recommendation: '비정상 프로세스나 트래픽 증가 여부를 확인하세요.'
      };
    }
    
    return null;
  }

  // 디스크 I/O 병목 탐지
  detectDiskBottleneck(currentMetrics) {
    const readIops = currentMetrics.metrics.disk.read_iops;
    const writeIops = currentMetrics.metrics.disk.write_iops;
    const totalIops = readIops + writeIops;
    
    // 일반적인 SSD의 IOPS 한계는 약 3000-5000
    if (totalIops > 3000) {
      return {
        type: 'disk_io_bottleneck',
        severity: totalIops > 4500 ? 'critical' : 'warning',
        total_iops: totalIops,
        description: `디스크 I/O가 높습니다 (${totalIops} IOPS). 디스크 병목 현상이 발생할 수 있습니다.`,
        recommendation: '데이터베이스 쿼리 최적화 또는 디스크 캐싱 설정을 검토하세요.'
      };
    }
    
    return null;
  }

  // 근본 원인 분석 (실제 기업에서 필요한 기능)
  performRootCauseAnalysis(serverMetrics, relatedServers) {
    const analysis = {
      primary_indicators: [],
      secondary_effects: [],
      probable_causes: [],
      investigation_steps: []
    };

    // 주요 지표 식별
    const alerts = this.checkThresholds(serverMetrics);
    analysis.primary_indicators = alerts.map(alert => alert.type);

    // 2차 영향 분석
    if (analysis.primary_indicators.includes('cpu_critical')) {
      analysis.secondary_effects.push('application_response_degradation');
      analysis.probable_causes.push('high_traffic_load', 'inefficient_query', 'background_process');
    }

    if (analysis.primary_indicators.includes('memory_critical')) {
      analysis.secondary_effects.push('garbage_collection_pressure', 'swap_usage');
      analysis.probable_causes.push('memory_leak', 'large_dataset_processing', 'cache_overflow');
    }

    // 조사 단계 생성
    analysis.investigation_steps = this.generateInvestigationSteps(analysis.probable_causes);

    return analysis;
  }

  // 실행 가능한 권장 사항 생성
  generateRecommendations(analysis) {
    const recommendations = [];

    // 임계 상황별 권장 사항
    analysis.alerts.forEach(alert => {
      switch (alert.type) {
        case 'cpu_critical':
          recommendations.push({
            priority: 'high',
            action: 'scale_up',
            description: 'CPU 부하 분산을 위해 오토 스케일링을 활성화하거나 인스턴스를 추가하세요.',
            estimated_time: '15분',
            automation_possible: true
          });
          break;
        case 'memory_critical':
          recommendations.push({
            priority: 'high', 
            action: 'memory_optimization',
            description: '메모리 사용량이 많은 프로세스를 확인하고 재시작을 고려하세요.',
            estimated_time: '10분',
            automation_possible: false
          });
          break;
        case 'disk_critical':
          recommendations.push({
            priority: 'critical',
            action: 'disk_cleanup',
            description: '로그 파일 정리 및 임시 파일 삭제를 즉시 수행하세요.',
            estimated_time: '5분',
            automation_possible: true
          });
          break;
      }
    });

    // 이상 패턴별 권장 사항
    analysis.anomalies.forEach(anomaly => {
      if (anomaly.type === 'memory_leak_pattern') {
        recommendations.push({
          priority: 'high',
          action: 'memory_profiling',
          description: '메모리 누수 가능성이 있습니다. 애플리케이션 메모리 프로파일링을 수행하세요.',
          estimated_time: '30분',
          automation_possible: false
        });
      }
      
      if (anomaly.type === 'disk_io_bottleneck') {
        recommendations.push({
          priority: 'medium',
          action: 'io_optimization',
          description: '디스크 I/O 최적화를 위해 데이터베이스 쿼리 및 디스크 액세스 패턴을 검토하세요.',
          estimated_time: '1시간',
          automation_possible: false
        });
      }
    });

    return recommendations;
  }

  // 헬스 스코어 계산
  calculateHealthScore(analysis) {
    let score = 100;
    
    // 알림에 따른 점수 차감
    analysis.alerts.forEach(alert => {
      if (alert.type.includes('critical')) {
        score -= 25;
      } else if (alert.type.includes('warning')) {
        score -= 10;
      }
    });
    
    // 이상 현상에 따른 점수 차감
    analysis.anomalies.forEach(anomaly => {
      if (anomaly.severity === 'critical') {
        score -= 15;
      } else if (anomaly.severity === 'warning') {
        score -= 5;
      }
    });
    
    // 최소 0점
    return Math.max(0, score);
  }

  // 조사 단계 생성
  generateInvestigationSteps(causes) {
    const steps = [];
    
    if (causes.includes('high_traffic_load')) {
      steps.push('트래픽 소스와 패턴을 분석하세요.');
      steps.push('비정상적인 사용자 요청이 있는지 확인하세요.');
    }
    
    if (causes.includes('memory_leak')) {
      steps.push('힙 덤프를 생성하고 메모리 사용 패턴을 분석하세요.');
      steps.push('최근 배포된 코드 변경사항을 검토하세요.');
    }
    
    if (causes.includes('inefficient_query')) {
      steps.push('데이터베이스 슬로우 쿼리 로그를 확인하세요.');
      steps.push('쿼리 최적화 또는 인덱스 추가를 고려하세요.');
    }
    
    return steps;
  }

  // 유틸리티 메서드들 (실제 프로덕션에서 재사용)
  calculateStatistics(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return {
      mean,
      stdDev: Math.sqrt(variance),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  createAlert(type, value, description) {
    return {
      type,
      value,
      description,
      timestamp: new Date().toISOString(),
      severity: type.includes('critical') ? 'critical' : 'warning'
    };
  }

  // 객체에서 중첩된 값 가져오기
  getNestedValue(obj, path) {
    const keys = path.split('.');
    return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);
  }

  // 배열이 단조 증가하는지 확인
  isMonotonicIncreasing(values) {
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i-1]) return false;
    }
    return true;
  }

  // 성장률 계산 (시간당 % 변화)
  calculateGrowthRate(values) {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    const hours = (values.length - 1) / 6; // 10분 간격 데이터라고 가정
    
    if (first === 0) return 0;
    return ((last - first) / first) * 100 / hours;
  }
} 