/**
 * 시뮬레이션용 서버 메타데이터 생성 스크립트
 */

import fs from 'fs';
import path from 'path';

// 서버 유형별 정의
const serverTypes = {
  // Kubernetes 클러스터 (15대)
  'k8s-master': {
    count: 3,
    specs: {
      cpu: "8 cores",
      memory: "32GB",
      storage: "500GB SSD",
      network: "10Gbps"
    },
    services: ["kube-apiserver", "kube-scheduler", "kube-controller-manager", "etcd-client"],
    metrics: ["cpu_usage", "memory_usage", "disk_usage", "network_io", "pod_count"],
    alerts: ["high_cpu", "memory_leak", "disk_full", "api_latency", "etcd_unavailable"]
  },
  'k8s-worker': {
    count: 10,
    specs: {
      cpu: "16 cores",
      memory: "64GB",
      storage: "1TB SSD",
      network: "10Gbps"
    },
    services: ["kubelet", "kube-proxy", "container-runtime", "node-problem-detector"],
    metrics: ["cpu_usage", "memory_usage", "disk_usage", "network_io", "pod_count", "container_count"],
    alerts: ["high_cpu", "memory_leak", "disk_full", "node_not_ready", "pod_crash_loop"]
  },
  'k8s-etcd': {
    count: 2,
    specs: {
      cpu: "4 cores",
      memory: "16GB",
      storage: "300GB SSD",
      network: "10Gbps"
    },
    services: ["etcd", "etcd-backup"],
    metrics: ["cpu_usage", "memory_usage", "disk_usage", "network_io", "etcd_latency", "key_count"],
    alerts: ["high_latency", "leader_change", "disk_full", "backup_failure", "quorum_lost"]
  },

  // 온프레미스 서버 (15대)
  'web-server': {
    count: 5,
    specs: {
      cpu: "4 cores",
      memory: "16GB",
      storage: "250GB SSD",
      network: "1Gbps"
    },
    services: ["nginx", "php-fpm", "redis-client"],
    metrics: ["cpu_usage", "memory_usage", "disk_usage", "request_count", "response_time", "active_connections"],
    alerts: ["high_load", "slow_response", "connection_limit", "ssl_cert_expiry", "http_5xx_errors"]
  },
  'db-server': {
    count: 3,
    specs: {
      cpu: "8 cores", 
      memory: "64GB",
      storage: "2TB SSD",
      network: "10Gbps"
    },
    services: ["mysql", "postgresql", "backup-service"],
    metrics: ["cpu_usage", "memory_usage", "disk_usage", "query_count", "slow_queries", "connection_count", "replication_lag"],
    alerts: ["high_cpu", "slow_queries", "replication_broken", "backup_failure", "disk_full"]
  },
  'redis-server': {
    count: 3,
    specs: {
      cpu: "4 cores",
      memory: "32GB",
      storage: "500GB SSD",
      network: "10Gbps"
    },
    services: ["redis", "redis-sentinel", "redis-exporter"],
    metrics: ["cpu_usage", "memory_usage", "disk_usage", "connected_clients", "evicted_keys", "rejected_connections"],
    alerts: ["memory_full", "high_latency", "sentinel_down", "replication_broken"]
  },
  'monitoring': {
    count: 4,
    specs: {
      cpu: "8 cores",
      memory: "32GB",
      storage: "1TB SSD",
      network: "10Gbps"
    },
    services: ["prometheus", "grafana", "alertmanager", "node-exporter"],
    metrics: ["cpu_usage", "memory_usage", "disk_usage", "alert_count", "scrape_duration", "target_count"],
    alerts: ["high_cpu", "disk_full", "scrape_failures", "config_reload_failure"]
  }
};

// 리전 정보
const regions = ["seoul-east", "seoul-west", "busan-central"];

// 메타데이터 생성 및 저장 함수
function generateAndSaveServerMetadata() {
  // 쿠버네티스 서버 생성
  for (const [typeKey, typeConfig] of Object.entries(serverTypes)) {
    const category = typeKey.startsWith('k8s') ? 'kubernetes' : 'onpremise';
    
    for (let i = 1; i <= typeConfig.count; i++) {
      // 서버 ID 생성 (01, 02, 03 형식)
      const serverId = `${typeKey}-${i.toString().padStart(2, '0')}`;
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      // 메타데이터 객체 생성
      const metadata = {
        id: serverId,
        name: `${typeKey.replace('-', ' ').toUpperCase()} ${i.toString().padStart(2, '0')}`,
        type: typeKey,
        environment: "production",
        region: region,
        specs: typeConfig.specs,
        services: typeConfig.services,
        monitoring: {
          metrics: typeConfig.metrics,
          alerts: typeConfig.alerts
        }
      };
      
      // 파일로 저장
      const filePath = path.join(
        process.cwd(), 
        'public', 
        'simulation-data', 
        'servers', 
        category, 
        `${serverId}.json`
      );
      
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), 'utf8');
      console.log(`Generated metadata for ${serverId}`);
    }
  }
  
  console.log('Server metadata generation complete!');
}

// 스크립트 실행
generateAndSaveServerMetadata(); 