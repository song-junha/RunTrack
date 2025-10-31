import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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
