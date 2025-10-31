import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

// SQL.js 초기화
export async function initDB(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  // 로컬 스토리지에서 기존 데이터베이스 로드
  const savedDB = localStorage.getItem('runtrack-db');
  if (savedDB) {
    const buf = Uint8Array.from(atob(savedDB), (c) => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    createTables(db);
  }

  return db;
}

// 테이블 생성
function createTables(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS races (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      raceId TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      memberCount INTEGER DEFAULT 0,
      FOREIGN KEY (raceId) REFERENCES races(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS runners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bibNumber TEXT NOT NULL,
      groupId TEXT NOT NULL,
      currentDistance REAL DEFAULT 0,
      currentPace TEXT,
      estimatedFinishTime TEXT,
      FOREIGN KEY (groupId) REFERENCES groups(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      runnerId TEXT NOT NULL,
      distance REAL NOT NULL,
      time TEXT NOT NULL,
      passTime TEXT,
      pace TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (runnerId) REFERENCES runners(id)
    );
  `);

  // 초기 데이터 삽입
  insertInitialData(database);
}

// 초기 데이터 삽입
function insertInitialData(database: Database) {
  // Races
  database.run(`
    INSERT OR IGNORE INTO races (id, name, code, date) VALUES
    ('1', '서울 레이스', '202550000213', '2025-10-12');
  `);

  // 초기 그룹, 러너, 스플릿 데이터는 비워둠
}

// 데이터베이스 저장
export function saveDB() {
  if (!db) return;
  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem('runtrack-db', base64);
}

// 데이터베이스 가져오기
export function getDB(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}
