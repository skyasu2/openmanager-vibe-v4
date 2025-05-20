// mcp-lite-server/routes/logs.js
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /logs - logs 테이블에서 전체 데이터 조회
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('logs').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /logs - status, message를 받아 logs 테이블에 새 레코드 삽입
router.post('/', async (req, res) => {
  try {
    const { status, message } = req.body;
    
    if (!status || !message) {
      return res.status(400).json({ error: 'status와 message는 필수 항목입니다.' });
    }
    
    // 새 로그 레코드 삽입 (timestamp는 Supabase에서 default now()로 자동 생성)
    const { data, error } = await supabase
      .from('logs')
      .insert([{ status, message }])
      .select();
      
    if (error) return res.status(500).json({ error: error.message });
    
    // 201 Created 응답과 함께 삽입된 데이터 반환
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;