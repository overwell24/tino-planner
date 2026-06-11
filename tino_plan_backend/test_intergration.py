"""
TinoPlan 백엔드 통합 테스트 (Integration Test)
================================================
단위 테스트 통과 후, 모듈(라우터)이 FastAPI 앱에 통합되어
end-to-end 로 동작하는지 검증한다.

통합 지점
  (A) 앱 부트스트랩    : 3개 라우터(eclass/calendar/courses)가 정상 등록되는가
  (B) 강의 DB 모듈     : 488과목 JSON 로딩 -> 필터링 API 까지 흐르는가
  (C) 캘린더 CRUD 모듈 : 생성->조회->수정->삭제 한 사이클이 상태를 공유하는가
  (D) 세션/에러 전파   : 로그인 없이 보호 자원 접근 시 401이 프론트로 전달되는가

크롤러(E-class)는 외부 계정/네트워크 의존이라 통합 테스트에서 제외하고,
계정 없이 결정적으로 검증 가능한 통합 경로만 자동화한다.

실행:  pytest test_integration.py -v
의존:  pip install fastapi pydantic httpx pytest requests beautifulsoup4 lxml
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ============================================================
# (A) 앱 부트스트랩: 라우터 통합
# ============================================================
class TestAppBootstrap:

    def test_health(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_root_version(self):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["version"] == "1.0.0"

    def test_openapi_has_all_routers(self):
        """3개 라우터의 대표 경로가 OpenAPI 스키마에 모두 등록됐는가"""
        paths = client.get("/openapi.json").json()["paths"]
        assert "/api/eclass/login" in paths      # eclass 라우터
        assert "/api/calendar/events" in paths    # calendar 라우터
        assert "/api/courses" in paths            # courses 라우터


# ============================================================
# (B) 강의 DB 모듈: 488과목 로딩 -> 필터 API
# ============================================================
class TestCourseDB:

    def test_full_course_list(self):
        """전체 강의가 빠짐없이 반환되는가 (DB 로딩 통합)"""
        res = client.get("/api/courses")
        assert res.status_code == 200
        courses = res.json()
        assert len(courses) == 488

    def test_course_schema(self):
        """각 강의가 프론트가 기대하는 스키마를 갖는가"""
        sample = client.get("/api/courses").json()[0]
        for key in ("title", "code", "grade", "credits", "type", "sections"):
            assert key in sample, f"필드 누락: {key}"
        # section 안의 스케줄 구조 검증 (d/s/e)
        sched = sample["sections"][0]["sched"]
        if sched:
            assert {"d", "s", "e"} <= set(sched[0].keys())

    def test_dept_filter(self):
        """학과(접두어) 필터가 동작하는가"""
        res = client.get("/api/courses", params={"dept": "ACS"})
        assert res.status_code == 200
        assert all(c["code"].startswith("ACS") for c in res.json())

    def test_grade_filter(self):
        """학년 필터가 동작하는가"""
        res = client.get("/api/courses", params={"grade": 3})
        assert all(c["grade"] == 3 for c in res.json())

    def test_dept_list(self):
        res = client.get("/api/courses/depts")
        assert res.status_code == 200
        depts = res.json()
        assert isinstance(depts, list) and len(depts) > 0


# ============================================================
# (C) 캘린더 CRUD 모듈: 한 사이클 상태 공유
# ============================================================
class TestCalendarCRUDCycle:

    def test_full_lifecycle(self):
        """생성 -> 조회 -> 수정 -> 삭제가 동일 저장소를 공유하는가"""
        uid = "integration_test_user"

        # 1) 생성
        create = client.post("/api/calendar/events", json={
            "user_id": uid,
            "title": "통합테스트 일정",
            "subject": "소프트웨어공학",
            "due_date": "2026-06-20T23:59:00",
            "type": "personal",
        })
        assert create.status_code == 201
        event_id = create.json()["id"]

        # 2) 조회 - 방금 만든 일정이 목록에 보이는가
        listed = client.get("/api/calendar/events", params={"user_id": uid})
        assert listed.status_code == 200
        assert any(e["id"] == event_id for e in listed.json())

        # 3) 수정 - 제목 변경이 반영되는가
        updated = client.put(f"/api/calendar/events/{event_id}",
                             json={"title": "수정된 일정"})
        assert updated.status_code == 200
        assert updated.json()["title"] == "수정된 일정"

        # 4) 삭제 - 삭제 후 목록에서 사라지는가
        deleted = client.delete(f"/api/calendar/events/{event_id}")
        assert deleted.status_code == 200
        after = client.get("/api/calendar/events", params={"user_id": uid})
        assert all(e["id"] != event_id for e in after.json())

    def test_user_isolation(self):
        """다른 사용자의 일정은 섞이지 않는가"""
        client.post("/api/calendar/events", json={
            "user_id": "userA", "title": "A의 일정",
            "due_date": "2026-06-01T10:00:00", "type": "personal",
        })
        b_events = client.get("/api/calendar/events",
                              params={"user_id": "userB"}).json()
        assert all(e["user_id"] == "userB" for e in b_events)

    def test_type_filter(self):
        """type 필터가 동작하는가"""
        uid = "filter_user"
        client.post("/api/calendar/events", json={
            "user_id": uid, "title": "시험", "due_date": "2026-06-15T09:00:00",
            "type": "exam",
        })
        exams = client.get("/api/calendar/events",
                          params={"user_id": uid, "type": "exam"}).json()
        assert all(e["type"] == "exam" for e in exams)

    def test_update_nonexistent_404(self):
        res = client.put("/api/calendar/events/no-such-id",
                        json={"title": "x"})
        assert res.status_code == 404


# ============================================================
# (D) 세션/에러 전파: 로그인 없이 보호 자원 접근
# ============================================================
class TestSessionErrorPropagation:

    def test_courses_without_login_401(self):
        """미로그인 상태에서 크롤링 자원 요청 시 401이 명확히 전달되는가
        (서버 예외가 500으로 새지 않고 프론트가 처리 가능한 에러로 변환되는가)"""
        res = client.get("/api/eclass/courses",
                        params={"user_id": "never_logged_in"})
        assert res.status_code == 401
        assert "detail" in res.json()

    def test_assignments_without_login_401(self):
        res = client.get("/api/eclass/assignments",
                        params={"user_id": "never_logged_in"})
        assert res.status_code == 401

    def test_logout_idempotent(self):
        """존재하지 않는 세션 로그아웃도 안전하게 처리되는가"""
        res = client.delete("/api/eclass/logout",
                           params={"user_id": "ghost"})
        assert res.status_code == 200
