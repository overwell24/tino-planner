"""
한국공학대 시간표 PDF → courses_2026_1.json 파싱 스크립트

사용법:
    cd tino_plan_backend
    python scripts/parse_pdf.py data/source/2026_1_시간표.pdf data/courses_2026_1.json

요구사항:
    pip install pdfplumber

출력 형식:
    [
      {
        "title": "객체지향언어",
        "code": "ACS22021",
        "grade": 2,
        "credits": 3,
        "type": "전선",
        "sections": [
          {
            "no": "01",
            "prof": "한경숙",
            "sched": [{"d": "화", "s": 7, "e": 8}, {"d": "목", "s": 1, "e": 2}],
            "room": "E동318호"
          },
          ...
        ]
      },
      ...
    ]
"""

import pdfplumber
import re
import json
import sys


def parse_schedule(s):
    """
    schedule 문자열에서 (slots, room) 추출

    예: '화 [7~8]\n15:30~17:20 목 [7~8]\n15:30~17:20\n(E동318호)'
        → ([{'d':'화','s':7,'e':8},{'d':'목','s':7,'e':8}], 'E동318호')

    단일 교시 [N]과 범위 [N~M] 둘 다 처리
    """
    if not s:
        return [], ""
    slots = []
    # [N~M] 또는 [N] 형식 매칭
    for m in re.finditer(r'([월화수목금토일])\s*\[(\d+)(?:~(\d+))?\]', s):
        day = m.group(1)
        start = int(m.group(2))
        end = int(m.group(3)) if m.group(3) else start
        slots.append({"d": day, "s": start, "e": end})
    # 강의실: 마지막 괄호
    room_m = re.search(r'\(([^()]+)\)\s*$', s.replace('\n', ' '))
    room = room_m.group(1).strip() if room_m else ""
    return slots, room


def parse_pdf(pdf_path):
    """PDF 전체에서 과목/분반 정보 추출"""
    courses = {}  # code → course dict

    with pdfplumber.open(pdf_path) as pdf:
        print(f"총 {len(pdf.pages)} 페이지")

        for pi, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            if not tables:
                continue

            for t in tables:
                for row in t:
                    if not row or len(row) < 9:
                        continue

                    grade_str = (row[0] or "").strip()
                    cls_type = (row[1] or "").strip()
                    title = (row[2] or "").strip().replace('\n', '')
                    code = (row[3] or "").strip()
                    section = (row[4] or "").strip()
                    credits_raw = (row[5] or "").strip()
                    prof = (row[7] or "").strip().replace('\n', '')
                    sched_raw = (row[8] or "").strip()

                    # 유효성 검사
                    if not code or not section:
                        continue
                    if not re.match(r'^[A-Z]{3}\d{5}$', code):
                        continue
                    if not re.match(r'^\d{1,2}$', section):
                        continue

                    # 학점: "3(0)" → 3
                    cm = re.match(r'(\d+)', credits_raw)
                    credits = int(cm.group(1)) if cm else 3

                    # 학년: 숫자가 아닐 수도 있음
                    try:
                        grade_num = int(grade_str)
                    except ValueError:
                        grade_num = 0

                    slots, room = parse_schedule(sched_raw)

                    # 과목 등록
                    if code not in courses:
                        courses[code] = {
                            "title": title,
                            "code": code,
                            "grade": grade_num,
                            "credits": credits,
                            "type": cls_type.split('\n')[0] if cls_type else "전선",
                            "sections": [],
                        }

                    # 중복 분반 방지 (PDF 페이지 경계에서 같은 분반이 두 번 추출되는 경우)
                    section_no = section.zfill(2)
                    if not any(s["no"] == section_no for s in courses[code]["sections"]):
                        courses[code]["sections"].append({
                            "no": section_no,
                            "prof": prof,
                            "sched": slots,
                            "room": room,
                        })

    return list(courses.values())


def main():
    if len(sys.argv) < 3:
        print("사용법: python parse_pdf.py <input.pdf> <output.json>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    json_path = sys.argv[2]

    print(f"[1] PDF 파싱: {pdf_path}")
    courses = parse_pdf(pdf_path)

    total_sections = sum(len(c["sections"]) for c in courses)
    print(f"[2] 추출 결과: {len(courses)}개 과목, {total_sections}개 분반")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)
    print(f"[3] 저장 완료: {json_path}")

    # 컴공 학부(ACS) 샘플 출력
    acs = [c for c in courses if c["code"].startswith("ACS")]
    if acs:
        print(f"\n[샘플] ACS 학부 과목 {len(acs)}개:")
        for c in sorted(acs, key=lambda x: x["code"])[:5]:
            first_sec = c["sections"][0] if c["sections"] else None
            prof = first_sec["prof"] if first_sec else ""
            print(f"  {c['code']} {c['title']} ({len(c['sections'])}분반) - 대표교수: {prof}")


if __name__ == "__main__":
    main()
