// mcp-lite-server/routes/logs.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 데이터 저장 경로
const DATA_FILE = path.join(__dirname, '../data/logs.json');

// 로그 데이터 파일이 없으면 생성
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// 로그 데이터 읽기
const getLogs = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('로그 파일 읽기 오류:', err);
    return [];
  }
};

// 로그 데이터 저장
const saveLogs = (logs) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2));
    return true;
  } catch (err) {
    console.error('로그 파일 저장 오류:', err);
    return false;
  }
};

// GET /logs - 전체 로그 데이터 조회
router.get('/', (req, res) => {
  try {
    const logs = getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /logs - status, message를 받아 새 로그 추가
router.post('/', (req, res) => {
  try {
    const { status, message } = req.body;
    
    if (!status || !message) {
      return res.status(400).json({ error: 'status와 message는 필수 항목입니다.' });
    }
    
    // 기존 로그 데이터 로드
    const logs = getLogs();
    
    // 새 로그 생성
    const newLog = { 
      id: Date.now().toString(), 
      status, 
      message, 
      timestamp: new Date().toISOString() 
    };
    
    // 로그 추가 및 저장
    logs.push(newLog);
    if (saveLogs(logs)) {
      // 201 Created 응답과 함께 삽입된 데이터 반환
      res.status(201).json(newLog);
    } else {
      res.status(500).json({ error: '로그 저장에 실패했습니다.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;