// supabaseClient.js
// Supabase 연결 및 환경변수 로드 (CommonJS 방식)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = supabase;
