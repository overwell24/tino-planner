"""
Sprint 1 단위 테스트
E-class 크롤러 모듈 테스트

실행: pytest test_crawler.py -v
"""

import pytest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../eclass_crawler"))
from crawler import EclassCrawler

# ── 테스트용 자격증명 (환경변수에서 읽기) ─────────────────────────
USER_ID = os.environ.get("ECLASS_USER_ID", "")
PASSWORD = os.environ.get("ECLASS_PASSWORD", "")

SKIP_REASON = "ECLASS_USER_ID / ECLASS_PASSWORD 환경변수 미설정"
requires_auth = pytest.mark.skipif(not USER_ID, reason=SKIP_REASON)


# ── TC-01: 크롤러 인스턴스 생성 ──────────────────────────────────
def test_crawler_init():
    """크롤러 인스턴스가 정상 생성되는지 확인"""
    crawler = EclassCrawler()
    assert crawler is not None
    assert crawler.session is not None
    assert crawler._user_id == ""
    assert crawler._main_html == ""


# ── TC-02: 로그인 성공 ───────────────────────────────────────────
@requires_auth
def test_login_success():
    """올바른 자격증명으로 로그인 성공 확인"""
    crawler = EclassCrawler()
    result = crawler.login(USER_ID, PASSWORD)
    assert result is True
    assert crawler._main_html != ""
    assert "로그아웃" in crawler._main_html


# ── TC-03: 로그인 실패 ───────────────────────────────────────────
def test_login_failure():
    """잘못된 자격증명으로 로그인 실패 확인"""
    crawler = EclassCrawler()
    result = crawler.login("wrong_id", "wrong_pw")
    assert result is False


# ── TC-04: 수강 과목 목록 파싱 ──────────────────────────────────
@requires_auth
def test_get_courses():
    """수강 과목 목록이 1개 이상 반환되는지 확인"""
    crawler = EclassCrawler()
    crawler.login(USER_ID, PASSWORD)
    courses = crawler.get_courses()

    assert isinstance(courses, list)
    assert len(courses) >= 1

    # 각 과목이 필수 필드를 가지는지 확인
    for course in courses:
        assert "kjkey" in course
        assert "name" in course
        assert "section" in course
        assert "schedule" in course
        assert course["kjkey"].startswith("A")  # 정규과목
        assert len(course["name"]) > 0


# ── TC-05: 과목 KJKEY 형식 검증 ─────────────────────────────────
@requires_auth
def test_kjkey_format():
    """KJKEY가 올바른 형식인지 확인 (예: A20261ACS1002201)"""
    import re
    crawler = EclassCrawler()
    crawler.login(USER_ID, PASSWORD)
    courses = crawler.get_courses()

    pattern = re.compile(r"^[A-Z]\d{4}\d[A-Z]{3}\d{5}\d{2}$")
    for course in courses:
        assert pattern.match(course["kjkey"]), \
            f"KJKEY 형식 오류: {course['kjkey']}"


# ── TC-06: 과제 목록 수집 ───────────────────────────────────────
@requires_auth
def test_get_assignments():
    """특정 과목(유닉스기초)의 과제 목록 수집 확인"""
    crawler = EclassCrawler()
    crawler.login(USER_ID, PASSWORD)
    courses = crawler.get_courses()

    # 유닉스기초 과목 찾기
    target = next((c for c in courses if "유닉스" in c["name"]), None)
    if not target:
        pytest.skip("유닉스기초 과목 없음")

    assignments = crawler.get_assignments(target["kjkey"], target["name"])
    assert isinstance(assignments, list)

    for a in assignments:
        assert "title" in a
        assert "due_date" in a
        assert "is_submitted" in a
        assert "course_name" in a
        assert a["type"] == "assignment"


# ── TC-07: 공지사항 수집 ────────────────────────────────────────
@requires_auth
def test_get_notices():
    """특정 과목(유닉스기초)의 공지사항 수집 확인"""
    crawler = EclassCrawler()
    crawler.login(USER_ID, PASSWORD)
    courses = crawler.get_courses()

    target = next((c for c in courses if "유닉스" in c["name"]), None)
    if not target:
        pytest.skip("유닉스기초 과목 없음")

    notices = crawler.get_notices(target["kjkey"], target["name"])
    assert isinstance(notices, list)
    assert len(notices) >= 1  # 유닉스기초는 공지가 있음을 확인

    for n in notices:
        assert "title" in n
        assert "date" in n
        assert "course_name" in n
        assert n["type"] == "notice"


# ── TC-08: 전체 수집 통합 테스트 ────────────────────────────────
@requires_auth
def test_crawl_all():
    """전체 크롤링 결과가 올바른 형식인지 확인"""
    crawler = EclassCrawler()
    result = crawler.crawl_all(USER_ID, PASSWORD)

    assert result["success"] is True
    assert "data" in result

    data = result["data"]
    assert "courses" in data
    assert "assignments" in data
    assert "notices" in data

    assert len(data["courses"]) >= 1
    # 최소 1개 과목에 공지 있음
    assert len(data["notices"]) >= 1
