-- RunTrack 데이터베이스 스키마

CREATE TABLE IF NOT EXISTS runners (
  id SERIAL PRIMARY KEY,
  bib_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bib_number ON runners(bib_number);
