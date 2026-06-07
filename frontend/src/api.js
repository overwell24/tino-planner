// frontend/src/api.js
// 백엔드 호출 + 응답 데이터를 프론트 state 구조로 변환

// 백엔드 BASE URL - 접속한 호스트를 기준으로 동적 결정
// (localhost로 PC 접속 시 → localhost:8000, 모바일에서 PC IP로 접속 시 → 그 IP:8000)
const BASE_URL = `http://${window.location.hostname}:8000`;

// ── HTTP 헬퍼 ──────────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── E-class API ────────────────────────────────────────────────────
export async function login(userId, password) {
  return request("/api/eclass/login", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, password }),
  });
}

export async function syncAll(userId) {
  return request(`/api/eclass/sync?user_id=${encodeURIComponent(userId)}`, {
    method: "POST",
  });
}

export async function logout(userId) {
  return request(`/api/eclass/logout?user_id=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

// ── 전체 강의 정보 (1학기 488과목) ────────────────────────────────
export async function getAllCourses() {
  return request("/api/courses");
}

// ── 개인 일정 API ──────────────────────────────────────────────────
export async function getEvents(userId) {
  return request(`/api/calendar/events?user_id=${encodeURIComponent(userId)}`);
}

export async function createEvent(userId, ev) {
  return request("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      title: ev.title,
      subject: ev.subject || "",
      due_date: ev.due.toISOString(),
      type: ev.type,
    }),
  });
}

export async function updateEvent(eventId, patch) {
  const body = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.subject !== undefined) body.subject = patch.subject;
  if (patch.due !== undefined) body.due_date = patch.due.toISOString();
  if (patch.type !== undefined) body.type = patch.type;
  return request(`/api/calendar/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(eventId) {
  return request(`/api/calendar/events/${eventId}`, { method: "DELETE" });
}

// ── 데이터 변환 유틸 ───────────────────────────────────────────────

// schedule 문자열 → [{d:"화",s:7,e:8}, ...]
// 예: "화 [7~8] 15:30~17:20 목 [7~8] 15:30~17:20 (E동318호)"
export function parseSchedule(scheduleStr) {
  if (!scheduleStr) return { sched: [], room: "" };
  const slotRegex = /([월화수목금])\s*\[(\d+)~(\d+)\]/g;
  const sched = [];
  let m;
  while ((m = slotRegex.exec(scheduleStr)) !== null) {
    sched.push({ d: m[1], s: Number(m[2]), e: Number(m[3]) });
  }
  // 강의실: 마지막 괄호 안
  const roomMatch = scheduleStr.match(/\(([^()]+)\)\s*$/);
  const room = roomMatch ? roomMatch[1].trim() : "";
  return { sched, room };
}

// "2026.06.02 오후 5:20" → Date
// "2026.05.30 오전 11:00" → Date
export function parseDueDate(dueStr) {
  if (!dueStr) return null;
  const m = dueStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s+(오전|오후)\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, ampm, h, min] = m;
  let hour = h ? Number(h) : 23;
  let minute = min ? Number(min) : 59;
  if (ampm === "오후" && hour < 12) hour += 12;
  if (ampm === "오전" && hour === 12) hour = 0;
  return new Date(Number(y), Number(mo) - 1, Number(d), hour, minute);
}

// 백엔드 sync 응답 → 프론트 state 구조
//   syncResponse: { data: { courses, assignments, notices } }
//   allCourses:   1학기 전체 강의 정보 (getAllCourses 결과)
//                 lssn_cd 매칭으로 교수명/credits/grade/type 채우기
export function transformSyncData(syncResponse, allCourses = []) {
  const data = syncResponse.data || syncResponse;
  const rawCourses = data.courses || [];
  const rawAssignments = data.assignments || [];

  // lssn_cd → 전체 DB 항목 매핑
  const lookup = {};
  allCourses.forEach(c => { lookup[c.code] = c; });

  // 1) 과목 변환 — lssn_cd로 전체 DB에서 메타데이터 매칭
  const coursesDB = rawCourses.map(c => {
    const { sched, room } = parseSchedule(c.schedule);
    const meta = lookup[c.lssn_cd];

    // 분반 매칭: 전체 DB에서 해당 분반의 교수명 찾기
    let prof = "";
    if (meta) {
      const matchedSec = meta.sections.find(s => s.no === c.section);
      if (matchedSec) prof = matchedSec.prof;
    }

    return {
      title: c.name,
      code: c.lssn_cd,
      kjkey: c.kjkey,
      grade: meta?.grade || 0,
      credits: meta?.credits || 3,
      type: meta?.type || "전공",
      sections: [{
        no: c.section,
        prof,
        sched,
        room,
      }],
    };
  });

  // 2) 수강 현황: code → section
  const enrolled = {};
  rawCourses.forEach(c => { enrolled[c.lssn_cd] = c.section; });

  // 3) 과제 → 이벤트
  let nextId = 1000;
  const events = rawAssignments
    .filter(a => !a.is_submitted)         // 제출 완료된 건 제외
    .map(a => {
      const due = parseDueDate(a.due_date);
      if (!due) return null;
      return {
        id: nextId++,
        title: `[과제] ${a.title}`,
        subject: a.course_name,
        due,
        type: "assignment",
      };
    })
    .filter(Boolean);

  return { coursesDB, enrolled, events };
}

// 개인 일정 API 응답 → 프론트 event 객체
export function transformPersonalEvent(apiEvent) {
  return {
    id: apiEvent.id,
    title: apiEvent.title,
    subject: apiEvent.subject || "",
    due: new Date(apiEvent.due_date),
    type: apiEvent.type,
  };
}