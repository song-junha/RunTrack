import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const RUNNERS_FILE = path.join(__dirname, 'runners.json');

// JSON 파싱 미들웨어
app.use(express.json());

// 선수 데이터 읽기
function readRunners() {
  try {
    if (fs.existsSync(RUNNERS_FILE)) {
      const data = fs.readFileSync(RUNNERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read runners:', error);
  }
  return [];
}

// 선수 데이터 저장
function writeRunners(runners) {
  try {
    fs.writeFileSync(RUNNERS_FILE, JSON.stringify(runners, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to write runners:', error);
    return false;
  }
}

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 선수 목록 조회
app.get('/api/runners', (req, res) => {
  const runners = readRunners();
  res.json(runners);
});

// 선수 추가
app.post('/api/runners', (req, res) => {
  const newRunner = req.body;
  const runners = readRunners();
  runners.push(newRunner);

  if (writeRunners(runners)) {
    res.status(201).json(newRunner);
  } else {
    res.status(500).json({ error: 'Failed to save runner' });
  }
});

// 선수 삭제
app.delete('/api/runners/:bibNumber', (req, res) => {
  const { bibNumber } = req.params;
  const { password } = req.body;
  const ADMIN_PASSWORD = '8282';

  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력해주세요' });
  }

  const runners = readRunners();
  const runner = runners.find(r => r.bibNumber === bibNumber);

  if (!runner) {
    return res.status(404).json({ error: '선수를 찾을 수 없습니다' });
  }

  // 관리자 비밀번호 또는 선수 비밀번호 확인
  if (password !== ADMIN_PASSWORD && runner.password !== password) {
    return res.status(403).json({ error: '비밀번호가 일치하지 않습니다' });
  }

  const filteredRunners = runners.filter(r => r.bibNumber !== bibNumber);

  if (writeRunners(filteredRunners)) {
    res.json({ success: true });
  } else {
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
