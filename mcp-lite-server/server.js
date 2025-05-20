const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
const dummyK8s = require('./dummyK8sDataGenerator');
const aiAgent = require('./ai_agent');
const supabase = require('./supabaseClient');

// 라우터 가져오기
const logsRouter = require('./routes/logs');

// CORS 설정 - 개발 환경과 Netlify 도메인 허용
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://openvibe3.netlify.app',
    'https://openmanager-vibe-v4.netlify.app'
  ],
  credentials: true
}));
app.use(bodyParser.json());

// 라우터 마운트
app.use('/logs', logsRouter);

app.post('/query', (req, res) => {
  const { query, context } = req.body;

  if (!query || !context) {
    return res.status(400).json({ result: 'query/context 값이 필요합니다.' });
  }

  const filePath = `./context/${context}.txt`;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ result: 'context 문서를 찾을 수 없습니다.' });
  }

  const content = fs.readFileSync(filePath, 'utf8');
  // query에 포함된 단어와 매칭되는 줄 찾기
  const lines = content.split('\n');
  const matched = lines.find(line => query.split(' ').some(word => line.includes(word)));

  res.json({ result: matched || '관련 내용을 찾지 못했습니다' });
});

app.get('/api/servers/metrics', (req, res) => {
  res.json(dummyK8s.getCurrentMetrics());
});
app.get('/api/servers/:id/metrics', (req, res) => {
  res.json(dummyK8s.getNodeMetrics(req.params.id));
});
app.get('/api/servers/metrics/history', (req, res) => {
  res.json(dummyK8s.getHistory());
});
app.get('/api/incidents', (req, res) => {
  res.json(dummyK8s.getIncidents());
});

app.post('/api/ai/query', (req, res) => {
  const { userId = 'default', question } = req.body;
  if (!question) return res.status(400).json({ error: '질문이 필요합니다.' });
  // 최신 메트릭 데이터 사용
  const metrics = Object.values(dummyK8s.getCurrentMetrics());
  const result = aiAgent.handleUserQuery(userId, question, metrics);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`MCP 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
