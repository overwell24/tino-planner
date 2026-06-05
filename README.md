# Tino Plan

한국공학대 수강신청 플래너 및 학사 캘린더

## 빠른 실행

### 1. 저장소 클론
```bash
git clone https://github.com/overwell24/tino-planner.git
cd tino-planner
```

### 2. 백엔드 실행 (터미널 1)
```bash
cd tino_plan_backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. 프론트엔드 실행 (터미널 2)
```bash
cd frontend
npm install
npm start
```

### 4. 브라우저에서 접속
http://localhost:3000

- **로그인** — 한국공학대 E-class 계정 (학번/비밀번호)
- **둘러보기** — 로그인 없이 사용 (가상 시간표)

## 필요 환경
- Node.js 18+
- Python 3.10+
- Chrome / Edge 120+
