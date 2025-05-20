// demoScenarioManager.js
// 데모 모드용 상태 시나리오 관리자 (정상→경고→심각→복구 순환)

// 시나리오 단계 정의
const SCENARIOS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  RECOVERY: 'recovery'
};

// 단계별 데이터 생성 함수
class DemoScenarioManager {
  constructor() {
    this.currentScenario = SCENARIOS.NORMAL;
    this.scenarioStartTime = Date.now();
    this.scenarioDuration = 15 * 1000; // 각 시나리오 단계는 15초 지속
    this.scenarioStep = 0;
    this.baseMetrics = {}; // dummyK8sDataGenerator에서 받을 기본 메트릭
  }

  // 기본 메트릭 데이터 설정
  setBaseMetrics(metrics) {
    this.baseMetrics = metrics;
  }

  // 현재 시나리오 단계 업데이트
  updateScenario() {
    const elapsedTime = Date.now() - this.scenarioStartTime;
    
    if (elapsedTime >= this.scenarioDuration) {
      // 다음 시나리오로 전환
      this.scenarioStep = (this.scenarioStep + 1) % 4;
      this.scenarioStartTime = Date.now();
      
      // 시나리오 단계 설정
      switch (this.scenarioStep) {
        case 0:
          this.currentScenario = SCENARIOS.NORMAL;
          break;
        case 1:
          this.currentScenario = SCENARIOS.WARNING;
          break;
        case 2:
          this.currentScenario = SCENARIOS.CRITICAL;
          break;
        case 3:
          this.currentScenario = SCENARIOS.RECOVERY;
          break;
      }
      
      console.log(`[DEMO] 시나리오 변경: ${this.currentScenario}`);
    }
    
    return this.currentScenario;
  }

  // 현재 시나리오에 따른 데이터 생성
  generateDemoMetrics() {
    if (!this.baseMetrics || Object.keys(this.baseMetrics).length === 0) {
      return {};
    }
    
    // 현재 시나리오 단계 업데이트
    this.updateScenario();
    
    // 메트릭 복제 및 시나리오에 따라 수정
    const demoMetrics = JSON.parse(JSON.stringify(this.baseMetrics));
    
    // 시나리오별 메트릭 조정
    Object.keys(demoMetrics).forEach(serverId => {
      const server = demoMetrics[serverId];
      
      switch (this.currentScenario) {
        case SCENARIOS.NORMAL:
          // 정상 상태: 기본 메트릭 유지 (약간의 변동만)
          server.cpu = Math.min(50 + Math.random() * 10, 100);
          server.memory = Math.min(40 + Math.random() * 15, 100);
          server.status = 'normal';
          break;
          
        case SCENARIOS.WARNING:
          // 경고 상태: CPU/메모리 증가, 일부 서버 경고
          server.cpu = Math.min(70 + Math.random() * 10, 100);
          server.memory = Math.min(65 + Math.random() * 15, 100);
          server.status = Math.random() > 0.7 ? 'warning' : 'normal';
          break;
          
        case SCENARIOS.CRITICAL:
          // 심각 상태: 높은 리소스 사용량, 다수 서버 심각
          server.cpu = Math.min(85 + Math.random() * 15, 100);
          server.memory = Math.min(80 + Math.random() * 20, 100);
          server.status = Math.random() > 0.6 ? 'critical' : 'warning';
          
          // 컨트롤 플레인 노드에 더 심각한 문제 발생
          if (server.name.includes('master')) {
            server.cpu = 95 + Math.random() * 5;
            server.status = 'critical';
          }
          break;
          
        case SCENARIOS.RECOVERY:
          // 복구 상태: 점진적 개선, 일부만 경고 상태 유지
          server.cpu = Math.min(60 + Math.random() * 10, 100);
          server.memory = Math.min(50 + Math.random() * 15, 100);
          server.status = Math.random() > 0.8 ? 'warning' : 'normal';
          break;
      }
      
      // 각 시나리오에서의 임의 변동
      server.disk = Math.min(server.disk + (Math.random() * 10 - 5), 100);
      
      // 1분 간격으로 가상 시간 진행 (프론트엔드에서 참조할 가상 시간)
      server.virtualTimestamp = new Date(
        Date.now() + (this.scenarioStep * this.scenarioDuration) + 
        (Date.now() - this.scenarioStartTime) * 4 // 시간 압축: 실제 1초 = 가상 4분
      ).toISOString();
    });
    
    return demoMetrics;
  }
}

module.exports = new DemoScenarioManager();