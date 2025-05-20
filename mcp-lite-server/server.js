const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Netlify 도메인만 허용하도록 CORS 설정
app.use(cors({
  origin: 'https://openvibe3.netlify.app'
}));
app.use(bodyParser.json());

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

app.listen(PORT, () => {
  console.log(`MCP 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
