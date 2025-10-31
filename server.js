import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 데이터베이스 연결 테스트
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// JSON 파싱 미들웨어
app.use(express.json());

// 헬스체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// 선수 목록 조회
app.get('/api/runners', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT bib_number as "bibNumber", name, password FROM runners ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch runners:', error);
    res.status(500).json({ error: 'Failed to fetch runners' });
  }
});

// 선수 추가
app.post('/api/runners', async (req, res) => {
  const { bibNumber, name, password } = req.body;

  if (!bibNumber || !name || !password) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요' });
  }

  try {
    // 중복 체크
    const existing = await pool.query(
      'SELECT bib_number FROM runners WHERE bib_number = $1',
      [bibNumber]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '이미 등록된 배번입니다' });
    }

    // 선수 추가
    const result = await pool.query(
      'INSERT INTO runners (bib_number, name, password) VALUES ($1, $2, $3) RETURNING bib_number as "bibNumber", name, password',
      [bibNumber, name, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add runner:', error);
    res.status(500).json({ error: 'Failed to save runner' });
  }
});

// 선수 삭제
app.delete('/api/runners/:bibNumber', async (req, res) => {
  const { bibNumber } = req.params;
  const { password } = req.body;
  const ADMIN_PASSWORD = '8282';

  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력해주세요' });
  }

  try {
    // 선수 조회
    const result = await pool.query(
      'SELECT bib_number, name, password FROM runners WHERE bib_number = $1',
      [bibNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '선수를 찾을 수 없습니다' });
    }

    const runner = result.rows[0];

    // 관리자 비밀번호 또는 선수 비밀번호 확인
    if (password !== ADMIN_PASSWORD && runner.password !== password) {
      return res.status(403).json({ error: '비밀번호가 일치하지 않습니다' });
    }

    // 선수 삭제
    await pool.query('DELETE FROM runners WHERE bib_number = $1', [bibNumber]);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete runner:', error);
    res.status(500).json({ error: 'Failed to delete runner' });
  }
});

// API 프록시 (CORS 우회)
app.get('/api/event/:eventId/player/:bibNumber', async (req, res) => {
  const { eventId, bibNumber } = req.params;
  const apiUrl = `https://www.myresult.co.kr/api/event/${eventId}/player/${bibNumber}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch data from MyResult API' });
  }
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - 모든 경로를 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
