const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
const k8sDataGenerator = require('./utils/k8sDataGenerator');
const aiAgent = require('./ai_agent');
const demoScenarioManager = require('./demoScenarioManager');

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

// 컨텍스트 경로 설정
const CONTEXT_PATH = path.join(__dirname, 'context');

/**
 * 기본 쿼리 엔드포인트 - 레거시 코드 (호환성을 위해 유지)
 */
app.post('/query', (req, res) => {
  const { query, context } = req.body;

  if (!query || !context) {
    return res.status(400).json({ result: '쿼리 또는 컨텍스트 값이 필요합니다.' });
  }

  try {
    // 개선된 컨텍스트 처리 사용
    const response = aiAgent.handleContextQuery(query, context);
    
    if (!response.context_used) {
      // 기존 단순 매칭 로직 (하위 호환성 용)
      const filePath = path.join(CONTEXT_PATH, `${context}.txt`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ result: '컨텍스트 문서를 찾을 수 없습니다.' });
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matched = lines.find(line => query.split(' ').some(word => line.includes(word)));
      
      res.json({ result: matched || '관련 내용을 찾지 못했습니다.' });
    } else {
      // 개선된 컨텍스트 처리 결과 반환
      res.json({ 
        result: response.answer,
        additional_context: response.additional_context
      });
    }
  } catch (error) {
    console.error('쿼리 처리 오류:', error);
    res.status(500).json({ result: '서버 내부 오류가 발생했습니다.' });
  }
});

/**
 * 향상된 API 엔드포인트 그룹화
 */

// API 경로 접두사
const API_PREFIX = '/api';

// 1. 서버 메트릭 관련 API
const metricsRouter = express.Router();

// 기본 서버 메트릭 API
metricsRouter.get('/servers/metrics', (req, res) => {
  try {
    res.json(k8sDataGenerator.getCurrentMetrics());
  } catch (error) {
    console.error('메트릭 정보 조회 오류:', error);
    res.status(500).json({ error: '메트릭 정보를 조회하는 중 오류가 발생했습니다.' });
  }
});

// 특정 서버 메트릭 API
metricsRouter.get('/servers/:id/metrics', (req, res) => {
  try {
    const serverMetrics = k8sDataGenerator.getNodeMetrics(req.params.id);
    if (!serverMetrics) {
      return res.status(404).json({ error: '해당 서버 정보를 찾을 수 없습니다.' });
    }
    res.json(serverMetrics);
  } catch (error) {
    console.error(`서버 ${req.params.id} 메트릭 조회 오류:`, error);
    res.status(500).json({ error: '서버 메트릭을 조회하는 중 오류가 발생했습니다.' });
  }
});

// 메트릭 히스토리 API
metricsRouter.get('/servers/metrics/history', (req, res) => {
  try {
    res.json(k8sDataGenerator.getHistory());
  } catch (error) {
    console.error('메트릭 히스토리 조회 오류:', error);
    res.status(500).json({ error: '메트릭 히스토리를 조회하는 중 오류가 발생했습니다.' });
  }
});

// 2. 인시던트 관련 API
metricsRouter.get('/incidents', (req, res) => {
  try {
    res.json(k8sDataGenerator.getIncidents());
  } catch (error) {
    console.error('인시던트 정보 조회 오류:', error);
    res.status(500).json({ error: '인시던트 정보를 조회하는 중 오류가 발생했습니다.' });
  }
});

// 3. 데모 모드 API
metricsRouter.get('/demo/metrics', (req, res) => {
  try {
    // 기본 메트릭을 시나리오 매니저에 제공
    demoScenarioManager.setBaseMetrics(k8sDataGenerator.getCurrentMetrics());
    
    // 현재 시나리오에 따른 데모 메트릭 생성 및 반환
    const demoMetrics = demoScenarioManager.generateDemoMetrics();
    res.json(demoMetrics);
  } catch (error) {
    console.error('데모 메트릭 생성 오류:', error);
    res.status(500).json({ error: '데모 메트릭을 생성하는 중 오류가 발생했습니다.' });
  }
});

// 4. AI 쿼리 관련 API
const aiRouter = express.Router();

// 기본 AI 쿼리 - NLU 기반 분석 및 응답
aiRouter.post('/query', (req, res) => {
  const { userId = 'default', question } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: '질문이 필요합니다.' });
  }
  
  try {
    // 최신 메트릭 데이터 사용
    const metrics = Object.values(k8sDataGenerator.getCurrentMetrics());
    const result = aiAgent.handleUserQuery(userId, question, metrics);
    
    // 프론트엔드와 일관성 유지를 위해 응답 구조 개선
    res.json({
      answer: result.answer,
      analysis: result.analysis,
      visualization_type: result.visualization_type,
      related_servers: result.related_servers || [],
      query_analysis: result.query_analysis,
      // 프론트엔드에 인텐트와 엔티티 정보를 명시적으로 제공
      intent: result.query_analysis?.intent,
      entities: result.query_analysis?.entities || {}
    });
  } catch (error) {
    console.error('AI 쿼리 처리 오류:', error);
    res.status(500).json({ 
      error: '서버 내부 오류',
      message: error.message
    });
  }
});

// NLU 분석 엔드포인트 - 프론트엔드에서 쿼리 분석에 사용 가능
aiRouter.post('/analyze', (req, res) => {
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: '질문이 필요합니다.' });
  }
  
  try {
    // NLU 분석 수행
    const analysis = aiAgent.analyzeQuery(question);
    res.json(analysis);
  } catch (error) {
    console.error('쿼리 분석 오류:', error);
    res.status(500).json({ 
      error: '분석 오류',
      message: error.message
    });
  }
});

// 컨텍스트 기반 문서 조회 API
aiRouter.post('/context-query', (req, res) => {
  const { query, context } = req.body;
  
  if (!query || !context) {
    return res.status(400).json({ error: '쿼리와 컨텍스트가 필요합니다.' });
  }
  
  try {
    const response = aiAgent.handleContextQuery(query, context);
    res.json(response);
  } catch (error) {
    console.error('컨텍스트 쿼리 오류:', error);
    res.status(500).json({ 
      error: '처리 오류',
      message: error.message
    });
  }
});

// 라우터 마운트
app.use(API_PREFIX, metricsRouter);
app.use(`${API_PREFIX}/ai`, aiRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`MCP 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`컨텍스트 경로: ${CONTEXT_PATH}`);
});
