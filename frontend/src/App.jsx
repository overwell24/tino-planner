// frontend/src/App.jsx
import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import TinoPlan from "./TinoPlan";
import { getAllCourses } from "./api";

const STORAGE_KEY = "tinoplan_v1";

// ── localStorage 헬퍼 ────────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // events의 due는 Date 객체로 복원
    if (data.events) {
      data.events = data.events.map(e => ({ ...e, due: new Date(e.due) }));
    }
    return data;
  } catch {
    return null;
  }
}
function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("localStorage 저장 실패:", err.message);
  }
}

export default function App() {
  // 초기값을 localStorage에서 복원
  const saved = loadFromStorage() || {};

  const [coursesDB, setCoursesDB] = useState(saved.coursesDB || []);
  const [enrolled, setEnrolled] = useState(saved.enrolled || {});
  const [events, setEvents] = useState(saved.events || []);
  const [userId, setUserId] = useState(null); // userId는 보안상 저장 안 함

  // coursesDB가 비어있으면 (첫 진입) 로딩 / 있으면 즉시 표시
  const [bootLoading, setBootLoading] = useState(coursesDB.length === 0);
  const [showLogin, setShowLogin] = useState(false);

  // 매 진입마다 강의 데이터 갱신 (학기 바뀌면 자동 반영)
  useEffect(() => {
    getAllCourses()
      .then(list => {
        // 기존에 크롤링으로 채워진 항목(prof 있음)은 보존, 나머지는 새 데이터로 교체
        setCoursesDB(prev => {
          const prevMap = {};
          prev.forEach(c => {
            // 크롤링으로 채워진 과목만 보존 (sections[0].prof가 있고 schedule도 있는 경우)
            const sec = c.sections?.[0];
            if (sec?.prof && sec?.sched?.length) prevMap[c.code] = c;
          });
          // 새 데이터를 베이스로 깔고, 보존 항목은 덮어쓰기
          const map = {};
          list.forEach(c => { map[c.code] = c; });
          Object.entries(prevMap).forEach(([k, v]) => { map[k] = v; });
          return Object.values(map);
        });
      })
      .catch(err => console.warn("강의 데이터 로드 실패:", err.message))
      .finally(() => setBootLoading(false));
  }, []);

  // state 변경 시 localStorage 동기화
  useEffect(() => {
    saveToStorage({ coursesDB, enrolled, events });
  }, [coursesDB, enrolled, events]);

  function handleLoginSuccess({ userId: uid, coursesDB: newCourses, enrolled: newEnrolled, events: newEvents }) {
    setUserId(uid);
    setCoursesDB(prev => {
      const map = {};
      prev.forEach(c => { map[c.code] = c; });
      newCourses.forEach(c => { map[c.code] = c; });
      return Object.values(map);
    });
    setEnrolled(prev => ({ ...prev, ...newEnrolled }));
    setEvents(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const fresh = newEvents.filter(e => !existingIds.has(e.id));
      return [...prev, ...fresh];
    });
    setShowLogin(false);
  }

  function handleLogout() {
    setUserId(null);
  }

  if (bootLoading) {
    return (
      <div style={{
        minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
        background:"#F8FAFC",fontFamily:"'Noto Sans KR',sans-serif",color:"#64748B",fontSize:14
      }}>
        강의 데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <>
      <TinoPlan
        userId={userId}
        coursesDB={coursesDB}
        enrolled={enrolled}
        events={events}
        setEnrolled={setEnrolled}
        setEvents={setEvents}
        onLogout={handleLogout}
        onLoginClick={() => setShowLogin(true)}
      />
      {showLogin && (
        <LoginPage
          mode="modal"
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  );
}