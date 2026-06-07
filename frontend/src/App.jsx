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
        // PDF 전체 데이터로 항상 갱신 (488과목 분반 정보 보존)
        setCoursesDB(list);
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
    // coursesDB는 PDF 전체 데이터 유지 (newCourses는 사용자 수강분반만 1개씩 들어있어서 덮어쓰면 다른 분반이 사라짐)
    // 다만 PDF에 없는 과목(예: 신규 개설)이 있으면 추가
    setCoursesDB(prev => {
      const map = {};
      prev.forEach(c => { map[c.code] = c; });
      newCourses.forEach(c => {
        if (!map[c.code]) map[c.code] = c;  // PDF에 없는 경우만 추가
      });
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