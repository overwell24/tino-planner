"""
Tino Plan — FastAPI 백엔드
Sprint 1: E-class 크롤링 API
Sprint 2: 캘린더 일정 CRUD API

실행: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import eclass, calendar, courses

app = FastAPI(
    title="Tino Plan API",
    description="한국공학대 수강신청 플래너 및 학사 캘린더 API",
    version="1.0.0",
)

# CORS 설정 (React 개발 서버 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(eclass.router)
app.include_router(calendar.router)
app.include_router(courses.router)


@app.get("/")
def root():
    return {"message": "Tino Plan API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
