"""
Sprint 1: E-class 크롤링 API 라우터
- POST /api/eclass/login
- GET  /api/eclass/courses
- GET  /api/eclass/assignments
- GET  /api/eclass/notices
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../eclass_crawler"))
from crawler import EclassCrawler

router = APIRouter(prefix="/api/eclass", tags=["Sprint1 - E-class 크롤링"])

# 메모리 세션 저장소 (실제 서비스에서는 Redis 등으로 교체)
# key: user_id, value: EclassCrawler 인스턴스
_sessions: dict[str, EclassCrawler] = {}


# ── 요청/응답 모델 ────────────────────────────────────────────────

class LoginRequest(BaseModel):
    user_id: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: str = ""

class Course(BaseModel):
    kjkey: str
    name: str
    section: str
    lssn_cd: str
    schedule: str

class Assignment(BaseModel):
    kjkey: str
    course_name: str
    title: str
    due_date: str
    is_submitted: bool
    type: str = "assignment"

class Notice(BaseModel):
    kjkey: str
    course_name: str
    title: str
    date: str
    type: str = "notice"


# ── 세션 검증 헬퍼 ───────────────────────────────────────────────

def get_crawler(user_id: str) -> EclassCrawler:
    crawler = _sessions.get(user_id)
    if not crawler:
        raise HTTPException(
            status_code=401,
            detail="로그인이 필요합니다. POST /api/eclass/login 먼저 호출하세요."
        )
    return crawler


# ── 엔드포인트 ───────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse, summary="E-class 로그인")
async def login(req: LoginRequest):
    """
    E-class 로그인 후 세션을 서버에 저장합니다.
    이후 요청에서 user_id를 쿼리 파라미터로 전달하여 세션을 식별합니다.
    """
    crawler = EclassCrawler()
    success = crawler.login(req.user_id, req.password)

    if not success:
        raise HTTPException(status_code=401, detail="로그인 실패: 아이디 또는 비밀번호를 확인하세요.")

    _sessions[req.user_id] = crawler
    return LoginResponse(success=True, message="로그인 성공", user_id=req.user_id)


@router.get("/courses", response_model=list[Course], summary="수강 과목 목록 조회")
async def get_courses(user_id: str):
    """
    로그인한 사용자의 현재 학기 수강 과목 목록을 반환합니다.
    main_form.acl HTML의 em.sub_open[kj] 선택자로 파싱합니다.
    """
    crawler = get_crawler(user_id)
    courses = crawler.get_courses()
    return courses


@router.get("/assignments", response_model=list[Assignment], summary="전체 과제 목록 조회")
async def get_assignments(user_id: str):
    """
    수강 중인 모든 과목의 과제 목록을 반환합니다.
    report_list.acl 엔드포인트를 과목별로 호출하여 수집합니다.
    """
    crawler = get_crawler(user_id)
    courses = crawler.get_courses()

    all_assignments = []
    for course in courses:
        assignments = crawler.get_assignments(course["kjkey"], course["name"])
        all_assignments.extend(assignments)

    return all_assignments


@router.get("/assignments/{kjkey}", response_model=list[Assignment], summary="특정 과목 과제 조회")
async def get_course_assignments(kjkey: str, user_id: str):
    """특정 과목(KJKEY)의 과제 목록을 반환합니다."""
    crawler = get_crawler(user_id)
    # kjkey로 과목명 찾기
    courses = crawler.get_courses()
    course = next((c for c in courses if c["kjkey"] == kjkey), None)
    course_name = course["name"] if course else kjkey

    return crawler.get_assignments(kjkey, course_name)


@router.get("/notices", response_model=list[Notice], summary="전체 공지사항 조회")
async def get_notices(user_id: str):
    """
    수강 중인 모든 과목의 공지사항을 반환합니다.
    notice_list.acl 엔드포인트를 과목별로 호출하여 수집합니다.
    """
    crawler = get_crawler(user_id)
    courses = crawler.get_courses()

    all_notices = []
    for course in courses:
        notices = crawler.get_notices(course["kjkey"], course["name"])
        all_notices.extend(notices)

    return all_notices


@router.get("/notices/{kjkey}", response_model=list[Notice], summary="특정 과목 공지사항 조회")
async def get_course_notices(kjkey: str, user_id: str):
    """특정 과목(KJKEY)의 공지사항을 반환합니다."""
    crawler = get_crawler(user_id)
    courses = crawler.get_courses()
    course = next((c for c in courses if c["kjkey"] == kjkey), None)
    course_name = course["name"] if course else kjkey

    return crawler.get_notices(kjkey, course_name)


@router.post("/sync", summary="전체 데이터 동기화")
async def sync_all(user_id: str):
    """
    수강 과목 + 과제 + 공지를 한 번에 수집하여 반환합니다.
    프론트엔드 초기 로딩 시 한 번 호출하는 용도입니다.
    """
    crawler = get_crawler(user_id)
    courses = crawler.get_courses()

    all_assignments, all_notices = [], []
    for course in courses:
        kjkey = course["kjkey"]
        name = course["name"]
        all_assignments.extend(crawler.get_assignments(kjkey, name))
        all_notices.extend(crawler.get_notices(kjkey, name))

    return {
        "success": True,
        "data": {
            "courses": courses,
            "assignments": all_assignments,
            "notices": all_notices,
        }
    }


@router.delete("/logout", summary="로그아웃 (세션 삭제)")
async def logout(user_id: str):
    """서버에서 세션을 삭제합니다."""
    if user_id in _sessions:
        del _sessions[user_id]
    return {"success": True, "message": "로그아웃 완료"}
