/**
 * 프로덕션 환경 구성
 */
export const PRODUCTION_CONFIG = {
  // 데이터 소스 설정
  dataSource: {
    type: 'dummy', // 'prometheus', 'grafana', 'datadog', 'cloudwatch', 'dummy'
    dummy: {
      scenarios: [
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
        },
        {
          id: "network_latency",
          probability: 0.04,
          affectedMetrics: {
            "network.latency_ms": "increase_by_200%"
          }
        }
      ],
      simulationSpeed: 1
    },
    prometheus: {
      url: process.env.REACT_APP_PROMETHEUS_URL,
      auth: {
        username: process.env.REACT_APP_PROMETHEUS_USERNAME,
        password: process.env.REACT_APP_PROMETHEUS_PASSWORD
      }
    }
  },
  
  // 시스템 설정
  system: {
    refreshInterval: 30000, // 30초마다 갱신
    alertThresholds: {
      cpu: {
        warning: 80,
        critical: 90
      },
      memory: {
        warning: 85,
        critical: 95
      },
      disk: {
        warning: 85,
        critical: 95
      },
      network: {
        latency: {
          warning: 200,
          critical: 500
        }
      }
    }
  },
  
  // 실시간 모니터링 설정
  monitoring: {
    enableRealTimeAlerts: true,
    enableAutoRemediation: true,
    notificationChannels: ['ui', 'email', 'slack']
  },
  
  // 분석 엔진 설정
  analysis: {
    enableAnomalyDetection: true,
    enablePredictiveAnalysis: true,
    modelConfidence: 0.8,
    lookbackPeriod: '7d'
  },
  
  // 실제 기업 환경처럼 MCP 설정
  dataSources: {
    primary: {
      type: 'dummy',
      config: {
        refreshInterval: 30000
      }
    }
  }
};

export default PRODUCTION_CONFIG; 