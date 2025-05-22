export const MONITORING_CONFIG = {
  // 실제 기업에서 커스터마이징 가능
  dataSource: {
    type: 'dummy', // 'prometheus', 'grafana', 'datadog' 등으로 변경
    refreshInterval: 30000, // 30초
    batchSize: 50
  },
  
  // 프로덕션에서 조정 가능한 임계값
  thresholds: {
    cpu: {
      warning: 75,
      critical: 90,
      sustained_duration: 300 // 5분
    },
    memory: {
      warning: 80,
      critical: 95,
      leak_detection: true
    },
    disk: {
      warning: 85,
      critical: 95,
      growth_rate_alert: 10 // %/hour
    },
    network: {
      latency_warning: 100, // ms
      latency_critical: 500,
      packet_loss_warning: 1 // %
    }
  },

  // 실제 기업 환경에 맞는 분석 룰
  analysis_rules: {
    correlation_window: 600, // 10분
    anomaly_sensitivity: 0.7,
    pattern_lookback_hours: 24,
    alert_suppression: 300 // 5분간 동일 알람 억제
  },

  // 알림 채널 (실제로는 Slack, Teams 등)
  notifications: {
    slack: { enabled: false, webhook: '' },
    email: { enabled: false, smtp: {} },
    pagerduty: { enabled: false, api_key: '' }
  }
}; 