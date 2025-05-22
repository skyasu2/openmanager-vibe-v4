export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
  }

  // 기업에서 커스텀 플러그인 등록 가능
  registerPlugin(name, plugin) {
    if (!plugin.initialize || !plugin.execute) {
      throw new Error('Plugin must have initialize and execute methods');
    }
    
    this.plugins.set(name, plugin);
    plugin.initialize();
  }

  // 특정 이벤트에 플러그인 훅 등록
  registerHook(event, pluginName, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push({ plugin: pluginName, callback });
  }

  // 훅 실행 (확장 포인트)
  async executeHooks(event, data) {
    const hooks = this.hooks.get(event) || [];
    const results = [];
    
    for (const hook of hooks) {
      try {
        const result = await hook.callback(data);
        results.push({ plugin: hook.plugin, result });
      } catch (error) {
        console.error(`Plugin ${hook.plugin} hook failed:`, error);
      }
    }
    
    return results;
  }
}

// 예시 플러그인: 사용자 정의 알림
export class CustomAlertPlugin {
  initialize() {
    console.log('Custom Alert Plugin initialized');
  }

  async execute(alertData) {
    // 기업별 커스텀 로직
    if (alertData.severity === 'critical') {
      await this.sendToCustomSystem(alertData);
    }
  }

  async sendToCustomSystem(data) {
    // 기업의 내부 시스템으로 알림 전송
    // 예: ITSM 도구, 커스텀 대시보드 등
    console.log('Sending alert to custom system:', data);
  }
}

// 예시 플러그인: 메트릭 변환기
export class MetricTransformerPlugin {
  constructor(config) {
    this.config = config || {};
    this.transformers = new Map();
  }
  
  initialize() {
    console.log('Metric Transformer Plugin initialized');
    
    // 기본 변환기 등록
    this.registerTransformer('cpu_to_percentage', (value) => value * 100);
    this.registerTransformer('bytes_to_mb', (value) => value / (1024 * 1024));
    this.registerTransformer('bytes_to_gb', (value) => value / (1024 * 1024 * 1024));
    this.registerTransformer('ms_to_s', (value) => value / 1000);
  }
  
  registerTransformer(name, transformFn) {
    this.transformers.set(name, transformFn);
  }
  
  async execute(metricsData) {
    const result = JSON.parse(JSON.stringify(metricsData));
    
    // 설정에 따라 메트릭 변환
    if (this.config.transformations) {
      for (const [metricPath, transformer] of Object.entries(this.config.transformations)) {
        const value = this.getNestedValue(result, metricPath);
        if (value !== undefined && this.transformers.has(transformer)) {
          this.setNestedValue(result, metricPath, this.transformers.get(transformer)(value));
        }
      }
    }
    
    return result;
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((o, key) => o && o[key] !== undefined ? o[key] : undefined, obj);
  }
  
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((o, key) => o[key] = o[key] || {}, obj);
    target[lastKey] = value;
  }
}

// 예시 플러그인: 데이터 익스포터
export class DataExporterPlugin {
  constructor(config) {
    this.config = config || {
      format: 'json',
      destination: 'console'
    };
  }
  
  initialize() {
    console.log('Data Exporter Plugin initialized');
  }
  
  async execute(data) {
    switch (this.config.format) {
      case 'csv':
        return this.exportCsv(data);
      case 'prometheus':
        return this.exportPrometheusFormat(data);
      case 'json':
      default:
        return this.exportJson(data);
    }
  }
  
  exportJson(data) {
    const jsonData = JSON.stringify(data, null, 2);
    
    if (this.config.destination === 'file') {
      // 실제 구현에서는 파일로 저장
      console.log('Exporting data to JSON file');
    } else {
      console.log('JSON Data:', jsonData);
    }
    
    return { success: true, format: 'json', data: jsonData };
  }
  
  exportCsv(data) {
    // 간단한 CSV 변환 로직
    let csvData = '';
    
    // 헤더 생성
    const headers = Object.keys(data[0] || {}).join(',');
    csvData += headers + '\n';
    
    // 데이터 행 생성
    data.forEach(item => {
      const row = Object.values(item).join(',');
      csvData += row + '\n';
    });
    
    if (this.config.destination === 'file') {
      // 실제 구현에서는 파일로 저장
      console.log('Exporting data to CSV file');
    } else {
      console.log('CSV Data:', csvData);
    }
    
    return { success: true, format: 'csv', data: csvData };
  }
  
  exportPrometheusFormat(data) {
    // Prometheus 텍스트 기반 형식으로 변환
    let prometheusData = '';
    
    // 서버 메트릭 변환 예시
    if (Array.isArray(data)) {
      data.forEach(server => {
        const serverName = server.id || 'unknown';
        
        // CPU 메트릭
        if (server.metrics && server.metrics.cpu) {
          prometheusData += `server_cpu_usage{server="${serverName}"} ${server.metrics.cpu.usage_percent}\n`;
        }
        
        // 메모리 메트릭
        if (server.metrics && server.metrics.memory) {
          prometheusData += `server_memory_usage{server="${serverName}"} ${server.metrics.memory.usage_percent}\n`;
        }
      });
    }
    
    if (this.config.destination === 'file') {
      // 실제 구현에서는 파일로 저장
      console.log('Exporting data to Prometheus format file');
    } else {
      console.log('Prometheus Data:', prometheusData);
    }
    
    return { success: true, format: 'prometheus', data: prometheusData };
  }
}

// 사용 예시
export function initializePlugins(config = {}) {
  const pluginManager = new PluginManager();
  
  // 플러그인 등록
  pluginManager.registerPlugin('customAlert', new CustomAlertPlugin());
  pluginManager.registerPlugin('metricTransformer', new MetricTransformerPlugin({
    transformations: {
      'metrics.disk.bytes_used': 'bytes_to_gb',
      'metrics.network.latency': 'ms_to_s'
    }
  }));
  pluginManager.registerPlugin('dataExporter', new DataExporterPlugin({
    format: 'json',
    destination: 'console'
  }));
  
  // 훅 등록
  pluginManager.registerHook('alert_triggered', 'customAlert', (data) => 
    pluginManager.plugins.get('customAlert').execute(data)
  );
  
  pluginManager.registerHook('metrics_received', 'metricTransformer', (data) => 
    pluginManager.plugins.get('metricTransformer').execute(data)
  );
  
  pluginManager.registerHook('data_export_requested', 'dataExporter', (data) => 
    pluginManager.plugins.get('dataExporter').execute(data)
  );
  
  return pluginManager;
} 