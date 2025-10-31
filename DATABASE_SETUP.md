# PostgreSQL 데이터베이스 설정 가이드

## Supabase 사용 (무료, 권장)

### 1. Supabase 계정 생성
1. https://supabase.com 접속
2. **Start your project** 클릭
3. GitHub 계정으로 로그인

### 2. 새 프로젝트 생성
1. **New Project** 클릭
2. 다음 정보 입력:
   - **Name**: `runtrack`
   - **Database Password**: 안전한 비밀번호 생성 (저장해두기!)
   - **Region**: Northeast Asia (Seoul)
   - **Pricing Plan**: Free

### 3. 데이터베이스 테이블 생성
1. 좌측 메뉴에서 **SQL Editor** 선택
2. **+ New query** 클릭
3. `schema.sql` 파일 내용을 복사해서 붙여넣기:
```sql
CREATE TABLE IF NOT EXISTS runners (
  id SERIAL PRIMARY KEY,
  bib_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bib_number ON runners(bib_number);
```
4. **Run** 버튼 클릭

### 4. Connection String 가져오기
1. 좌측 메뉴에서 **Project Settings** (톱니바퀴 아이콘)
2. **Database** 섹션 선택
3. **Connection string** → **URI** 탭
4. **Connection string** 복사 (예: `postgresql://postgres:[YOUR-PASSWORD]@...`)

### 5. 로컬 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
NODE_ENV=development
```

### 6. Railway 환경 변수 설정
1. Railway Dashboard → RunTrack 프로젝트
2. **Variables** 탭
3. **New Variable** 클릭:
   - **Name**: `DATABASE_URL`
   - **Value**: 위에서 복사한 Connection String
4. **New Variable** 클릭:
   - **Name**: `NODE_ENV`
   - **Value**: `production`

## 대안: Railway PostgreSQL (유료)

Railway에서 직접 PostgreSQL을 추가할 수도 있습니다 ($1/GB/month):

1. Railway Dashboard → RunTrack 프로젝트
2. **New** → **Database** → **Add PostgreSQL**
3. 자동으로 `DATABASE_URL` 환경 변수 생성됨
4. **Data** 탭 → **Query** → `schema.sql` 실행

## 테스트

로컬에서 테스트:
```bash
npm start
```

http://localhost:3000/health 접속해서 `{"status": "ok"}` 확인
