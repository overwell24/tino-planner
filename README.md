# Tino Plan

한국공학대 수강신청 플래너 및 학사 캘린더

## 배포된 서비스 바로 사용하기

설치 없이 아래 주소로 바로 접속할 수 있습니다.

**https://tinoplanner.vercel.app**

- **로그인** — 한국공학대 E-class 계정 (학번/비밀번호)
- **둘러보기** — 로그인 없이 사용 (가상 시간표)
- 모바일에서도 그대로 접속 가능합니다.

> 로컬에서 직접 실행하거나 개발에 참여하려면 아래 **빠른 실행**을 참고하세요.

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

## 테스트 — 통합 테스트 실행

단위 검증 후, 모듈 간 인터페이스가 올바르게 연결되는지 확인합니다.
**총 37개 (백엔드 15 + 프론트 22)**

### 백엔드 (pytest)

```bash
cd tino_plan_backend
pip install pytest "httpx<0.28"
pytest test_integration.py -v
```

> ⚠️ `httpx`는 0.28 이상이면 `TestClient(app)`에서 에러가 납니다. 반드시 `<0.28`로 설치하세요.

### 프론트 (Jest)

```bash
cd frontend
npm test
```

watch 모드에서 `a`로 전체 실행, `q`로 종료합니다.

### 무엇을 검증하나

| 영역 | 파일 | 통합 지점 |
|------|------|-----------|
| 백엔드 | `tino_plan_backend/test_integration.py` | 라우터 등록 · 488과목 DB · 캘린더 CRUD · 미로그인 401 |
| 포맷 계약 | `frontend/src/api.test.js` | 백엔드 출력 ↔ 프론트 파서 (시간표/마감일/DB 병합) |
| 추천 로직 | `frontend/src/RecommendModal.test.js` | 추천 결과 충돌 불변식 (무충돌 · 필수포함 · 학점 · 공강) |

> 테스트 파일과 `pytest`/`httpx`는 로컬 테스트 전용이라 배포 빌드 및 `requirements.txt`에는 포함되지 않습니다.

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

## 모바일에서 사용하기

같은 와이파이망에 PC와 모바일을 연결한 상태에서:

### 백엔드 실행 (외부 접속 허용)

```bash
cd tino_plan_backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### PC의 IP 확인

```bash
ipconfig    # Windows
ifconfig    # Mac/Linux
```

"IPv4 주소" (예: 192.168.x.x) 확인.

### 모바일에서 접속

브라우저에서 `http://192.168.x.x:3000` 접속.
**처음 실행 시 Windows 방화벽 알림이 뜨면 "허용" 클릭.**
