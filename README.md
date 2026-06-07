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


## 데이터 갱신 — 학기마다 시간표 파싱

학교에서 배포하는 시간표 PDF를 파싱해 `courses_2026_1.json`을 생성합니다.

### 사전 준비
```bash
pip install pdfplumber
```

### 실행
```bash
cd tino_plan_backend
python scripts/parse_pdf.py <PDF 경로> <출력 JSON 경로>
```

예시:
```bash
python scripts/parse_pdf.py data/source/2026_1_시간표.pdf data/courses_2026_1.json
```

### 결과 확인
- 콘솔에 추출된 과목 수 / 분반 수가 출력됩니다.
- 생성된 JSON은 백엔드 재시작 후 `GET /api/courses` 로 서빙됩니다.

### 학기 변경 시
1. 새 학기 PDF를 `data/source/` 에 저장
2. 위 명령으로 새 JSON 생성 (`courses_2026_2.json` 등)
3. `routers/courses.py` 의 `_DATA_PATH` 를 새 파일로 교체
4. `TinoPlan.jsx` 의 학기 기간 체크 조건(`getMonth() >= 2 && <= 5`) 수정
