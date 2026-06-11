/**
 * 백엔드 ↔ 프론트 Contract 통합 테스트
 * ===================================================
 * 백엔드(크롤러/calendar)가 내보내는 데이터 포맷을
 * 프론트(api.js)의 변환 함수가 규약대로 해석하는지 검증한다.
 * 데이터 포맷 불일치는 두 모듈을 합쳤을 때 가장 흔히 터지는 통합 결함이므로
 * 실제 크롤러 출력 포맷 샘플을 입력으로 사용한다.
 *
 * 실행: npm test -- api.test.js   (CRA / jest)
 */

import {
  parseSchedule,
  parseDueDate,
  transformSyncData,
  transformPersonalEvent,
} from "./api";

// ── (1) schedule 문자열 파싱 ───────────────────────────────────────
// 크롤러 출력 예: "화 [7~8] 15:30~17:20 목 [7~8] 15:30~17:20 (E동318호)"
describe("parseSchedule: 크롤러 schedule 문자열 → {d,s,e} 변환", () => {
  test("복수 요일 슬롯과 강의실을 모두 추출한다", () => {
    const { sched, room } = parseSchedule(
      "화 [7~8] 15:30~17:20 목 [7~8] 15:30~17:20 (E동318호)"
    );
    expect(sched).toEqual([
      { d: "화", s: 7, e: 8 },
      { d: "목", s: 7, e: 8 },
    ]);
    expect(room).toBe("E동318호");
  });

  test("단일 슬롯도 파싱한다", () => {
    const { sched } = parseSchedule("월 [1~3] 09:00~11:50 (산융305호)");
    expect(sched).toEqual([{ d: "월", s: 1, e: 3 }]);
  });

  test("빈 문자열은 빈 결과를 반환한다 (방어적 파싱)", () => {
    expect(parseSchedule("")).toEqual({ sched: [], room: "" });
    expect(parseSchedule(null)).toEqual({ sched: [], room: "" });
  });
});

// ── (2) 마감일 문자열 파싱 ─────────────────────────────────────────
// 크롤러 출력 예: "2026.06.02 오후 5:20"
describe("parseDueDate: 한국어 오전/오후 날짜 → Date 변환", () => {
  test("오후 시간을 24시간제로 변환한다", () => {
    const d = parseDueDate("2026.06.02 오후 5:20");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // 0-index → 6월
    expect(d.getDate()).toBe(2);
    expect(d.getHours()).toBe(17);
    expect(d.getMinutes()).toBe(20);
  });

  test("오전 시간을 그대로 둔다", () => {
    expect(parseDueDate("2026.05.30 오전 11:00").getHours()).toBe(11);
  });

  test("시간이 없으면 23:59로 기본 설정한다 (마감 처리 안전값)", () => {
    const d = parseDueDate("2026.06.10");
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
  });

  test("파싱 불가 문자열은 null을 반환한다", () => {
    expect(parseDueDate("미정")).toBeNull();
    expect(parseDueDate("")).toBeNull();
  });
});

// ── (3) sync 응답 → 프론트 state 변환 (488 DB 병합) ──────────────
describe("transformSyncData: 크롤러 결과 + 488과목 DB 병합", () => {
  const allCourses = [
    {
      code: "ACS12345",
      grade: 3,
      credits: 3,
      type: "전공",
      sections: [
        { no: "01", prof: "홍길동", sched: [], room: "" },
        { no: "02", prof: "김철수", sched: [], room: "" },
      ],
    },
  ];

  const syncResponse = {
    data: {
      courses: [
        {
          kjkey: "A2026ACS1234501",
          name: "운영체제",
          section: "02",
          lssn_cd: "ACS12345",
          schedule: "월 [1~2] 09:00~10:50 수 [1~2] 09:00~10:50 (E동504호)",
        },
      ],
      assignments: [
        {
          course_name: "운영체제",
          title: "과제1",
          due_date: "2026.06.15 오후 11:59",
          is_submitted: false,
        },
        {
          course_name: "운영체제",
          title: "제출한과제",
          due_date: "2026.06.01 오후 5:00",
          is_submitted: true, // 제출 완료 → 이벤트에서 제외돼야 함
        },
      ],
      notices: [],
    },
  };

  test("lssn_cd로 488 DB의 교수명/학점/학년을 병합한다", () => {
    const { coursesDB } = transformSyncData(syncResponse, allCourses);
    const os = coursesDB[0];
    expect(os.title).toBe("운영체제");
    expect(os.credits).toBe(3); // DB에서 가져옴
    expect(os.grade).toBe(3);
    expect(os.sections[0].prof).toBe("김철수"); // section "02"의 교수
  });

  test("schedule 문자열이 sched 배열로 변환돼 병합된다", () => {
    const { coursesDB } = transformSyncData(syncResponse, allCourses);
    expect(coursesDB[0].sections[0].sched).toEqual([
      { d: "월", s: 1, e: 2 },
      { d: "수", s: 1, e: 2 },
    ]);
  });

  test("수강 현황(enrolled)이 code→section으로 매핑된다", () => {
    const { enrolled } = transformSyncData(syncResponse, allCourses);
    expect(enrolled["ACS12345"]).toBe("02");
  });

  test("제출 완료 과제는 이벤트에서 제외된다", () => {
    const { events } = transformSyncData(syncResponse, allCourses);
    expect(events).toHaveLength(1);
    expect(events[0].title).toContain("과제1");
    expect(events[0].type).toBe("assignment");
  });

  test("DB에 없는 과목도 기본값으로 안전하게 변환한다", () => {
    const orphan = {
      data: {
        courses: [{ kjkey: "X", name: "미등록", section: "01",
                    lssn_cd: "ZZZ99999", schedule: "" }],
        assignments: [], notices: [],
      },
    };
    const { coursesDB } = transformSyncData(orphan, allCourses);
    expect(coursesDB[0].credits).toBe(3); // 기본값
    expect(coursesDB[0].type).toBe("전공"); // 기본값
  });
});

// ── (4) 개인 일정 API 응답 변환 ───────────────────────────────────
describe("transformPersonalEvent: calendar API 응답 → 프론트 event", () => {
  test("ISO 날짜 문자열을 Date로 변환한다", () => {
    const ev = transformPersonalEvent({
      id: "uuid-1", title: "스터디", subject: "알고리즘",
      due_date: "2026-06-20T14:00:00", type: "personal",
    });
    expect(ev.due instanceof Date).toBe(true);
    expect(ev.due.getFullYear()).toBe(2026);
    expect(ev.type).toBe("personal");
  });
});
