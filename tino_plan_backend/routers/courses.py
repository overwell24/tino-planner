"""
1학기 전체 강의 정보 API
- GET /api/courses              전체 488개
- GET /api/courses?dept=ACS     학과 필터
- GET /api/courses?grade=3      학년 필터
- GET /api/courses?dept=ACS&grade=3  복합 필터
"""

from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(prefix="/api/courses", tags=["전체 강의 정보"])

# 모듈 로드 시 한 번만 읽기
_DATA_PATH = Path(__file__).parent.parent / "data" / "courses_2026_1.json"
_ALL_COURSES = json.loads(_DATA_PATH.read_text(encoding="utf-8"))


@router.get("", summary="전체 강의 목록 조회")
async def get_courses(dept: str | None = None, grade: int | None = None):
    """
    2026-1학기 전체 강의 정보 반환.
    - dept: 학수번호 앞 3자리 (예: ACS=컴공, AAK=교양)
    - grade: 학년 (1~4)
    """
    courses = _ALL_COURSES
    if dept:
        courses = [c for c in courses if c["code"].startswith(dept.upper())]
    if grade is not None:
        courses = [c for c in courses if c["grade"] == grade]
    return courses


@router.get("/depts", summary="학과(접두어) 목록 조회")
async def get_depts():
    """학수번호 앞 3자리 prefix 목록 (학과/계열 구분용)"""
    depts = sorted({c["code"][:3] for c in _ALL_COURSES})
    return depts
