/**
 * 추천 알고리즘 ↔ 충돌 감지 통합 테스트
 * ===================================================
 * 단위로는 멀쩡한 두 기능(시간표 생성 / 충돌 판정)이
 * 결합됐을 때도 불변식을 지키는지 검증한다.
 *
 * 핵심 불변식:
 *   I1. 추천된 모든 시간표는 내부 시간 충돌이 없어야 한다
 *   I2. required(필수) 과목은 결과에 반드시 포함된다
 *   I3. 학점은 [minCredits, maxCredits] 범위를 벗어나지 않는다
 *   I4. noDays(공강 요일)에는 수업이 배치되지 않는다
 *
 * 실행: npm test -- RecommendModal.test.js
 */

import {
  schedsConflict,
  generateSchedules,
} from "./RecommendModal";

// ── 테스트용 강의 DB ──────────────────────────────────────────────
// 충돌을 의도적으로 설계: A02 와 B01 은 월 1~2교시로 겹침
const coursesDB = [
  {
    code: "ACS001", credits: 3, grade: 3, type: "전공",
    sections: [
      { no: "01", prof: "P1", sched: [{ d: "월", s: 1, e: 2 }], room: "" },
      { no: "02", prof: "P2", sched: [{ d: "화", s: 3, e: 4 }], room: "" },
    ],
  },
  {
    code: "ACS002", credits: 3, grade: 3, type: "전공",
    sections: [
      { no: "01", prof: "P3", sched: [{ d: "월", s: 1, e: 2 }], room: "" }, // ACS001-01과 충돌
      { no: "02", prof: "P4", sched: [{ d: "수", s: 5, e: 6 }], room: "" },
    ],
  },
  {
    code: "AAK010", credits: 2, grade: 1, type: "교양",
    sections: [
      { no: "01", prof: "P5", sched: [{ d: "금", s: 7, e: 8 }], room: "" },
    ],
  },
];

// 결과 시간표 전체의 자기충돌 여부 검사 헬퍼
function hasInternalConflict(slots) {
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i], b = slots[j];
      if (a.d === b.d && !(a.e < b.s || a.s > b.e)) return true;
    }
  return false;
}

// ── 충돌 감지 단위 검증 (통합 전제) ───────────────────────────────
describe("schedsConflict: 시간 겹침 판정", () => {
  test("같은 요일 교시가 겹치면 충돌", () => {
    expect(schedsConflict([{ d: "월", s: 1, e: 2 }],
                          [{ d: "월", s: 2, e: 3 }])).toBe(true);
  });
  test("다른 요일이면 충돌 아님", () => {
    expect(schedsConflict([{ d: "월", s: 1, e: 2 }],
                          [{ d: "화", s: 1, e: 2 }])).toBe(false);
  });
  test("인접하지만 안 겹치면 충돌 아님 (월1~2 vs 월3~4)", () => {
    expect(schedsConflict([{ d: "월", s: 1, e: 2 }],
                          [{ d: "월", s: 3, e: 4 }])).toBe(false);
  });
});

// ── 통합 불변식 검증 ─────────────────────────────────────────────
describe("generateSchedules: 생성 결과가 충돌 불변식을 지킨다", () => {
  test("[I1] 추천된 모든 시간표는 내부 충돌이 없다", () => {
    const results = generateSchedules({
      explicitPool: ["ACS001", "ACS002", "AAK010"],
      required: [],
      autoPool: [],
      noDays: [],
      minCredits: 2,
      maxCredits: 10,
      coursesDB,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(hasInternalConflict(r.slots)).toBe(false);
    }
  });

  test("[I1] 충돌하는 두 분반을 동시에 담은 조합은 추천되지 않는다", () => {
    // ACS001-01(월1~2)과 ACS002-01(월1~2)은 공존 불가.
    // 둘 중 하나는 다른 분반(ACS001-02 화, ACS002-02 수)으로 풀려야 함.
    const results = generateSchedules({
      explicitPool: ["ACS001", "ACS002"],
      required: ["ACS001", "ACS002"], // 둘 다 필수
      autoPool: [],
      noDays: [],
      minCredits: 6,
      maxCredits: 6,
      coursesDB,
    });
    for (const r of results) {
      const both01 = r.enrolled["ACS001"] === "01" && r.enrolled["ACS002"] === "01";
      expect(both01).toBe(false); // 충돌 조합 금지
      expect(hasInternalConflict(r.slots)).toBe(false);
    }
  });

  test("[I2] 필수 과목은 모든 추천 결과에 포함된다", () => {
    const results = generateSchedules({
      explicitPool: ["ACS001", "ACS002", "AAK010"],
      required: ["ACS001"],
      autoPool: [],
      noDays: [],
      minCredits: 3,
      maxCredits: 10,
      coursesDB,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.enrolled["ACS001"]).toBeDefined();
    }
  });

  test("[I3] 학점이 지정 범위를 벗어나지 않는다", () => {
    const results = generateSchedules({
      explicitPool: ["ACS001", "ACS002", "AAK010"],
      required: [],
      autoPool: [],
      noDays: [],
      minCredits: 5,
      maxCredits: 8,
      coursesDB,
    });
    for (const r of results) {
      expect(r.credits).toBeGreaterThanOrEqual(5);
      expect(r.credits).toBeLessThanOrEqual(8);
    }
  });

  test("[I4] 공강 요일에는 수업이 배치되지 않는다", () => {
    // 금요일 공강 → AAK010(금 7~8)은 선택 불가해야 함
    const results = generateSchedules({
      explicitPool: ["ACS001", "ACS002", "AAK010"],
      required: [],
      autoPool: [],
      noDays: ["금"],
      minCredits: 2,
      maxCredits: 10,
      coursesDB,
    });
    for (const r of results) {
      expect(r.slots.some((s) => s.d === "금")).toBe(false);
    }
  });

  test("autoPool 자동 채우기 후에도 충돌 불변식이 유지된다", () => {
    // explicit으로 ACS001만 고르고, 학점 부족분을 autoPool로 채움
    const results = generateSchedules({
      explicitPool: ["ACS001"],
      required: ["ACS001"],
      autoPool: ["ACS002", "AAK010"],
      noDays: [],
      minCredits: 5,
      maxCredits: 8,
      coursesDB,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(hasInternalConflict(r.slots)).toBe(false);
      expect(r.credits).toBeGreaterThanOrEqual(5);
    }
  });
});
