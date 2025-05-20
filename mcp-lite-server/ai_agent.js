// MCP 서버 AI 에이전트 - 지능형 분석 및 자연어 응답
const CONTEXT_HISTORY = {};

function zScore(arr, value) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = Math.sqrt(arr.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / arr.length);
  return (value - mean) / std;
}

function analyzeMetrics(metrics) {
  // CPU 이상 탐지 (Z-스코어 2.0 초과)
  const cpuArr = metrics.map(m => m.cpu);
  const memArr = metrics.map(m => m.memory);
  const diskArr = metrics.map(m => m.disk);
  const cpuZ = metrics.map(m => zScore(cpuArr, m.cpu));
  const memZ = metrics.map(m => zScore(memArr, m.memory));
  const diskZ = metrics.map(m => zScore(diskArr, m.disk));
  return metrics.map((m, i) => ({
    ...m,
    cpu_anomaly: cpuZ[i] > 2,
    memory_anomaly: memZ[i] > 2,
    disk_anomaly: diskZ[i] > 2
  }));
}

function generateNaturalResponse(question, analysis, context) {
  // CPU 사용률이 높은 서버
  if (/cpu.*높|많/i.test(question)) {
    const top = analysis.sort((a, b) => b.cpu - a.cpu).slice(0, 3);
    if (top.length === 0) return 'CPU 데이터가 없습니다.';
    let resp = `현재 CPU 사용률이 가장 높은 서버는 ${top.map(s => `${s.hostname}(${s.cpu.toFixed(1)}%)`).join(', ')}입니다.`;
    const critical = top.filter(s => s.cpu_anomaly);
    if (critical.length > 0) {
      resp += `\n\n이 중 ${critical.map(s => s.hostname).join(', ')}는(은) 통계적으로 비정상적(CPU 스파이크)입니다.`;
      resp += '\n원인: 백그라운드 작업, 서비스 트래픽 급증, 파드 재시작 등.';
      resp += '\n권장 조치: 불필요한 프로세스 종료, 서비스 분산, 리소스 증설.';
    }
    return resp;
  }
  // 메모리 누수 의심
  if (/메모리.*누수|증가|많/i.test(question)) {
    const leak = analysis.filter(s => s.memory_anomaly);
    if (leak.length === 0) return '메모리 누수 의심 노드가 없습니다.';
    return `메모리 누수 의심 노드: ${leak.map(s => `${s.hostname}(${s.memory.toFixed(1)}%)`).join(', ')}\n지속적 증가 패턴 감지.\n권장 조치: 장기 실행 파드 점검, 메모리 해제 확인.`;
  }
  // 최근 장애 많은 서버
  if (/장애.*많|이벤트.*많/i.test(question)) {
    const incidents = analysis.filter(s => s.incident && s.incident !== 'Normal');
    if (incidents.length === 0) return '최근 장애가 감지된 서버가 없습니다.';
    const freq = {};
    incidents.forEach(s => { freq[s.hostname] = (freq[s.hostname]||0)+1; });
    const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
    return `최근 장애가 가장 많았던 서버: ${sorted[0][0]} (${sorted[0][1]}회)\n주요 이벤트: ${incidents.filter(s=>s.hostname===sorted[0][0]).map(s=>s.incident).join(', ')}`;
  }
  // 기본 응답
  return '질문을 이해하지 못했습니다. 예시: "CPU 사용률이 높은 서버는?"';
}

function updateContext(userId, question, answer, analysis) {
  CONTEXT_HISTORY[userId] = { question, answer, analysis };
}

module.exports = {
  handleUserQuery: (userId, question, metrics) => {
    const analysis = analyzeMetrics(metrics);
    const answer = generateNaturalResponse(question, analysis, CONTEXT_HISTORY[userId]);
    updateContext(userId, question, answer, analysis);
    return { answer, analysis };
  }
};
