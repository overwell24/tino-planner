"""
E-class 크롤러 — 로컬 실행 전용
eclass.tukorea.ac.kr

실행: python crawler.py <학번> <비밀번호>
결과: output.json
"""

import requests
from bs4 import BeautifulSoup
import json
import sys
import re

BASE_URL = "https://eclass.tukorea.ac.kr"


class EclassCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9",
        })
        self._main_html = ""
        self._user_id = ""

    # ── 1. 로그인 ────────────────────────────────────────────────
    def login(self, user_id: str, password: str) -> bool:
        self._user_id = user_id
        self.session.get(f"{BASE_URL}/ilos/main/main_form.acl", timeout=10)
        form_resp = self.session.get(
            f"{BASE_URL}/ilos/main/member/login_form.acl", timeout=10
        )
        soup = BeautifulSoup(form_resp.text, "html.parser")
        challenge_el = soup.find("input", {"name": "challenge"})
        challenge = challenge_el.get("value", "") if challenge_el else ""

        self.session.headers.update({
            "Referer": f"{BASE_URL}/ilos/main/member/login_form.acl",
            "Origin": BASE_URL,
            "Content-Type": "application/x-www-form-urlencoded",
        })
        resp = self.session.post(
            f"{BASE_URL}/ilos/lo/login.acl",
            data={"returnURL": "", "challenge": challenge, "response": "",
                  "usr_id": user_id, "usr_pwd": password},
            timeout=10, allow_redirects=False
        )
        try:
            r = resp.json()
            if not r.get("isError", True):
                main = self.session.get(f"{BASE_URL}/ilos/main/main_form.acl", timeout=10)
                self._main_html = main.text
                print("[OK] 로그인 성공")
                return True
            print(f"[FAIL] 로그인 실패: {r.get('message','')}")
            return False
        except Exception:
            pass

        if "main_form.acl" in resp.text or resp.status_code in (301, 302):
            main = self.session.get(f"{BASE_URL}/ilos/main/main_form.acl", timeout=10)
            if "로그아웃" in main.text:
                self._main_html = main.text
                print("[OK] 로그인 성공")
                return True

        print("[FAIL] 로그인 실패")
        return False

    # ── 2. 수강 과목 목록 ────────────────────────────────────────
    def get_courses(self) -> list:
        soup = BeautifulSoup(self._main_html, "html.parser")
        courses = []
        for em in soup.find_all("em", class_="sub_open"):
            kjkey = em.get("kj", "").strip()
            if not kjkey or not kjkey.startswith("A"):
                continue
            raw = re.sub(r'\s+', ' ', em.get_text(separator=" ", strip=True))
            m = re.match(r"(.+?)\s*\((\d+)\)\s*$", raw)
            name = m.group(1).strip() if m else raw
            section = m.group(2) if m else ""
            span = em.find_next_sibling("span")
            schedule = re.sub(r'\s+', ' ', span.get_text(strip=True)) if span else ""
            lm = re.match(r"[A-Z](\d{4})(\d)([A-Z]{3}\d{5})(\d{2})$", kjkey)
            lssn_cd = lm.group(3) if lm else ""
            courses.append({
                "kjkey": kjkey,
                "name": name,
                "section": section,
                "lssn_cd": lssn_cd,
                "schedule": schedule,
            })
        print(f"   수강 과목 {len(courses)}개")
        for c in courses:
            print(f"   - {c['name']} ({c['section']}분반) | {c['schedule']}")
        return courses

    # ── 3. 과목방 진입 ───────────────────────────────────────────
    def enter_course(self, kjkey: str) -> str:
        """과목방 진입 후 submain URL 반환"""
        self.session.headers.update({
            "Referer": f"{BASE_URL}/ilos/main/main_form.acl",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json, */*",
            "Content-Type": "application/x-www-form-urlencoded",
        })
        room_resp = self.session.post(
            f"{BASE_URL}/ilos/st/course/eclass_room2.acl",
            data={"KJKEY": kjkey, "returnData": "json",
                  "returnURI": "/ilos/st/course/submain_form.acl", "encoding": "utf-8"},
            timeout=10
        )
        return_url = room_resp.json().get("returnURL", "")
        full_url = (BASE_URL + return_url) if not return_url.startswith("http") else return_url
        if "KJKEY" not in full_url:
            full_url += f"?KJKEY={kjkey}"

        self.session.headers.update({
            "X-Requested-With": "",
            "Accept": "text/html,*/*",
            "Referer": f"{BASE_URL}/ilos/main/main_form.acl",
        })
        self.session.get(full_url, timeout=10)
        # Referer에 사용할 때 한글 없는 고정 URL 반환
        return f"{BASE_URL}/ilos/st/course/submain_form.acl"

    # ── 4. 과제 목록 (report_list.acl) ───────────────────────────
    def get_assignments(self, kjkey: str, course_name: str) -> list:
        self.enter_course(kjkey)

        # report_list.acl — 파라미터: ud(학번), ky(kjkey)
        self.session.headers.update({
            "Referer": f"{BASE_URL}/ilos/st/course/submain_form.acl",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "text/html, */*",
            "Content-Type": "application/x-www-form-urlencoded",
        })
        resp = self.session.post(
            f"{BASE_URL}/ilos/st/course/report_list.acl",
            data={
                "start": "1",
                "display": "100",
                "SCH_VALUE": "",
                "ud": self._user_id,
                "ky": kjkey,
                "encoding": "utf-8",
            },
            timeout=10
        )
        soup = BeautifulSoup(resp.text, "html.parser")

        assignments = []
        for row in soup.select("table tbody tr"):
            # 제목: .subjt_top
            title_el = row.select_one(".subjt_top")
            if not title_el:
                # 대안: td a
                title_el = row.select_one("td.left a")
            if not title_el:
                continue

            cols = row.select("td")
            # 마감일: 보통 뒤에서 2번째 td
            due_date = ""
            for col in cols:
                text = col.text.strip()
                # 날짜 패턴 매칭
                if re.search(r'\d{4}\.\d{2}\.\d{2}', text):
                    due_date = text
            is_submitted = "제출완료" in row.text or "제출" in row.text

            assignments.append({
                "kjkey": kjkey,
                "course_name": course_name,
                "title": title_el.text.strip(),
                "due_date": due_date,
                "is_submitted": is_submitted,
                "type": "assignment",
            })
        return assignments

    # ── 5. 공지사항 (notice_list.acl) ────────────────────────────
    def get_notices(self, kjkey: str, course_name: str) -> list:
        self.enter_course(kjkey)

        self.session.headers.update({
            "Referer": f"{BASE_URL}/ilos/st/course/submain_form.acl",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "text/html, */*",
            "Content-Type": "application/x-www-form-urlencoded",
        })
        resp = self.session.post(
            f"{BASE_URL}/ilos/st/course/notice_list.acl",
            data={"KJKEY": kjkey, "encoding": "utf-8"},
            timeout=10
        )
        soup = BeautifulSoup(resp.text, "html.parser")

        notices = []
        for row in soup.select("table tbody tr"):
            title_el = row.select_one(".subjt_top")
            if not title_el:
                continue
            cols = row.select("td")
            notices.append({
                "kjkey": kjkey,
                "course_name": course_name,
                "title": title_el.text.strip(),
                "date": cols[-1].text.strip() if cols else "",
                "type": "notice",
            })
        return notices

    # ── 6. 전체 수집 ─────────────────────────────────────────────
    def crawl_all(self, user_id: str, password: str) -> dict:
        print("\n=== E-class 크롤링 시작 ===\n")
        if not self.login(user_id, password):
            return {"success": False}

        print("\n[1] 수강 과목 목록 수집 중...")
        courses = self.get_courses()
        if not courses:
            return {"success": False}

        print(f"\n[2] 과제/공지 수집 중... (총 {len(courses)}개 과목)")
        all_assignments, all_notices = [], []
        for i, course in enumerate(courses):
            kjkey = course["kjkey"]
            name = course["name"]
            print(f"   [{i+1}/{len(courses)}] {name} ({course['section']}분반)")
            assignments = self.get_assignments(kjkey, name)
            notices = self.get_notices(kjkey, name)
            print(f"         과제 {len(assignments)}개, 공지 {len(notices)}개")
            all_assignments += assignments
            all_notices += notices

        result = {
            "success": True,
            "data": {
                "courses": courses,
                "assignments": all_assignments,
                "notices": all_notices,
            }
        }

        with open("output.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\n[OK] 완료!")
        print(f"   수강 과목: {len(courses)}개")
        print(f"   과제:      {len(all_assignments)}개")
        print(f"   공지:      {len(all_notices)}개")
        print(f"   -> output.json 저장됨")
        return result


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("사용법: python crawler.py <학번> <비밀번호>")
        sys.exit(1)

    crawler = EclassCrawler()
    crawler.crawl_all(sys.argv[1], sys.argv[2])