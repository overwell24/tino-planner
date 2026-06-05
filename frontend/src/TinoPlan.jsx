import { useState, useEffect } from "react";
import { createEvent as apiCreateEvent, updateEvent as apiUpdateEvent, deleteEvent as apiDeleteEvent, getEvents as apiGetEvents, logout as apiLogout, transformPersonalEvent } from "./api";

const TODAY = new Date(2026, 4, 28);
const DAY_KO = ["월", "화", "수", "목", "금"];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const SLOT_HOUR = {1:9,2:10,3:11,4:12,5:13,6:14,7:15,8:16,9:17,10:18,11:19};

const SUBJ_COLORS_LIGHT = [
  { bg:"#EEF2FF", border:"#6366F1", text:"#3730A3" },
  { bg:"#ECFDF5", border:"#10B981", text:"#065F46" },
  { bg:"#FFF7ED", border:"#F97316", text:"#9A3412" },
  { bg:"#FDF4FF", border:"#A855F7", text:"#6B21A8" },
  { bg:"#EFF6FF", border:"#3B82F6", text:"#1E40AF" },
  { bg:"#FFF1F2", border:"#F43F5E", text:"#9F1239" },
  { bg:"#F0FDF4", border:"#22C55E", text:"#14532D" },
  { bg:"#FEFCE8", border:"#EAB308", text:"#713F12" },
];

// 다크: 채도 낮춘 짙은 톤 + 밝은 텍스트 (회색 베이스에 조화)
const SUBJ_COLORS_DARK = [
  { bg:"#363555", border:"#818CF8", text:"#C7D2FE" },
  { bg:"#2A3F35", border:"#34D399", text:"#A7F3D0" },
  { bg:"#3F3326", border:"#FB923C", text:"#FED7AA" },
  { bg:"#3D2E48", border:"#C084FC", text:"#E9D5FF" },
  { bg:"#2C384F", border:"#60A5FA", text:"#BFDBFE" },
  { bg:"#412A36", border:"#FB7185", text:"#FECDD3" },
  { bg:"#2A3D32", border:"#4ADE80", text:"#BBF7D0" },
  { bg:"#3F3A26", border:"#FACC15", text:"#FEF08A" },
];

const COURSES_DB = [
  { title:"글쓰기", code:"AAK12043", grade:1, credits:3, type:"교필",
    sections:[
      { no:"01", prof:"김인경", sched:[{d:"화",s:5,e:7}], room:"산융305호" },
      { no:"02", prof:"김소은", sched:[{d:"화",s:5,e:7}], room:"산융709호" },
    ]},
  { title:"대학영어", code:"AAK10070", grade:1, credits:2, type:"교선",
    sections:[
      { no:"01", prof:"이수길", sched:[{d:"수",s:1,e:2}], room:"중앙408호" },
      { no:"02", prof:"이수길", sched:[{d:"화",s:3,e:4}], room:"중앙408호" },
    ]},
  { title:"파이썬프로그래밍", code:"AAK10087", grade:1, credits:3, type:"교선",
    sections:[
      { no:"01", prof:"차준심", sched:[{d:"월",s:6,e:7},{d:"화",s:8,e:8}], room:"산융407호" },
      { no:"02", prof:"김원주", sched:[{d:"월",s:1,e:2},{d:"수",s:1,e:1}], room:"산융302호" },
    ]},
  { title:"선형대수학", code:"ACS10041", grade:1, credits:3, type:"전선",
    sections:[
      { no:"01", prof:"정성택", sched:[{d:"월",s:2,e:2},{d:"목",s:5,e:6}], room:"E동222호" },
      { no:"02", prof:"박경원", sched:[{d:"월",s:2,e:2},{d:"목",s:5,e:6}], room:"E동512호" },
    ]},
  { title:"자료구조", code:"ACS20010", grade:2, credits:3, type:"전필",
    sections:[
      { no:"01", prof:"방영철", sched:[{d:"월",s:8,e:9},{d:"수",s:7,e:8}], room:"E동513호" },
      { no:"02", prof:"박정민", sched:[{d:"월",s:8,e:9},{d:"수",s:7,e:8}], room:"E동318호" },
      { no:"03", prof:"이동훈", sched:[{d:"금",s:5,e:8}], room:"E동318호" },
    ]},
  { title:"유닉스기초", code:"ACS10022", grade:2, credits:3, type:"전선",
    sections:[
      { no:"01", prof:"전광일", sched:[{d:"월",s:6,e:7},{d:"화",s:5,e:6}], room:"E동319호" },
      { no:"02", prof:"나보균", sched:[{d:"월",s:6,e:7},{d:"화",s:5,e:6}], room:"E동423호" },
      { no:"11", prof:"나보균", sched:[{d:"화",s:7,e:8},{d:"수",s:7,e:8}], room:"E동423호" },
      { no:"12", prof:"오세춘", sched:[{d:"화",s:7,e:8},{d:"수",s:7,e:8}], room:"E동319호" },
    ]},
  { title:"객체지향언어", code:"ACS22021", grade:2, credits:3, type:"전선",
    sections:[
      { no:"01", prof:"한경숙", sched:[{d:"화",s:7,e:8},{d:"목",s:1,e:2}], room:"E동318호" },
      { no:"02", prof:"허훈식", sched:[{d:"화",s:7,e:8},{d:"목",s:1,e:2}], room:"E동517호" },
      { no:"11", prof:"한경숙", sched:[{d:"화",s:5,e:6},{d:"목",s:5,e:6}], room:"E동318호" },
      { no:"12", prof:"허훈식", sched:[{d:"화",s:5,e:6},{d:"목",s:5,e:6}], room:"E동517호" },
    ]},
  { title:"논리회로", code:"ACS24013", grade:3, credits:3, type:"전선",
    sections:[
      { no:"01", prof:"최종필", sched:[{d:"월",s:3,e:4},{d:"수",s:3,e:4}], room:"E동517호" },
      { no:"02", prof:"최진구", sched:[{d:"월",s:3,e:4},{d:"수",s:3,e:4}], room:"E동321호" },
    ]},
  { title:"운영체제", code:"ACS20021", grade:3, credits:3, type:"전필",
    sections:[
      { no:"01", prof:"오세춘", sched:[{d:"화",s:9,e:11}], room:"E동222호" },
      { no:"02", prof:"전광일", sched:[{d:"수",s:9,e:11}], room:"E동318호" },
      { no:"03", prof:"전광일", sched:[{d:"화",s:9,e:11}], room:"E동318호" },
      { no:"11", prof:"이진호", sched:[{d:"월",s:7,e:7},{d:"수",s:3,e:4}], room:"E동421호" },
      { no:"12", prof:"오세춘", sched:[{d:"월",s:7,e:7},{d:"수",s:3,e:4}], room:"E동222호" },
    ]},
  { title:"알고리즘", code:"ACS30010", grade:3, credits:3, type:"전필",
    sections:[
      { no:"01", prof:"서대영", sched:[{d:"월",s:2,e:2},{d:"화",s:5,e:6}], room:"E동421호" },
      { no:"02", prof:"방영철", sched:[{d:"월",s:2,e:2},{d:"화",s:5,e:6}], room:"E동422호" },
      { no:"03", prof:"방영철", sched:[{d:"수",s:9,e:11}], room:"E동422호" },
      { no:"11", prof:"서대영", sched:[{d:"월",s:6,e:6},{d:"화",s:7,e:8}], room:"E동421호" },
      { no:"12", prof:"방영철", sched:[{d:"월",s:6,e:6},{d:"화",s:7,e:8}], room:"E동422호" },
    ]},
  { title:"소프트웨어공학", code:"ACS33010", grade:3, credits:3, type:"전필",
    sections:[
      { no:"01", prof:"박정민", sched:[{d:"수",s:2,e:2},{d:"목",s:5,e:6}], room:"E동421호" },
      { no:"02", prof:"조강명", sched:[{d:"수",s:2,e:4}], room:"E동424호" },
      { no:"03", prof:"허훈식", sched:[{d:"목",s:9,e:11}], room:"E동222호" },
      { no:"11", prof:"허훈식", sched:[{d:"화",s:1,e:2},{d:"수",s:2,e:2}], room:"E동222호" },
      { no:"12", prof:"조강명", sched:[{d:"금",s:6,e:8}], room:"E동422호" },
    ]},
  { title:"네트워크프로그래밍", code:"ACS35030", grade:3, credits:3, type:"전선",
    sections:[
      { no:"01", prof:"이보경", sched:[{d:"화",s:7,e:8},{d:"목",s:7,e:8}], room:"E동513호" },
      { no:"02", prof:"정의훈", sched:[{d:"화",s:7,e:8},{d:"목",s:7,e:8}], room:"E동516호" },
      { no:"11", prof:"이보경", sched:[{d:"화",s:5,e:6},{d:"목",s:5,e:6}], room:"E동513호" },
      { no:"12", prof:"정의훈", sched:[{d:"화",s:5,e:6},{d:"목",s:5,e:6}], room:"E동516호" },
    ]},
  { title:"인공지능", code:"ACS40012", grade:4, credits:3, type:"전선",
    sections:[
      { no:"01", prof:"배유석", sched:[{d:"월",s:8,e:9},{d:"화",s:3,e:4}], room:"E동517호" },
      { no:"02", prof:"박성호", sched:[{d:"월",s:8,e:9},{d:"목",s:7,e:8}], room:"E동319호" },
      { no:"11", prof:"박성호", sched:[{d:"화",s:3,e:4},{d:"목",s:3,e:4}], room:"E동319호" },
    ]},
];

function buildColorMap(dark, courses = COURSES_DB) {
  const palette = dark ? SUBJ_COLORS_DARK : SUBJ_COLORS_LIGHT;
  const map = {};
  courses.forEach((c, i) => { map[c.code] = palette[i % palette.length]; });
  return map;
}
const DAY_IDX = {월:0,화:1,수:2,목:3,금:4};
let nextId = 200;

// ── 테마 CSS 변수 ─────────────────────────────────────────────────────
function getThemeVars(dark) {
  return dark ? `
    --bg: #202124; --bg2: #292A2D; --bg3: #3C4043;
    --border: #3C4043; --border2: #5F6368;
    --text: #E8EAED; --text2: #BDC1C6; --text3: #9AA0A6;
    --card: #292A2D; --header: #202124;
    --input-bg: #292A2D; --input-border: #5F6368;
    --hover: #35363A;
  ` : `
    --bg: #F8FAFC; --bg2: #F1F5F9; --bg3: #E2E8F0;
    --border: #E2E8F0; --border2: #CBD5E1;
    --text: #1E293B; --text2: #64748B; --text3: #94A3B8;
    --card: #ffffff; --header: #ffffff;
    --input-bg: #ffffff; --input-border: #CBD5E1;
    --hover: #F8FAFC;
  `;
}

function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function getDDay(due) {
  const d = Math.ceil((due - TODAY) / 86400000);
  if (d===0) return "D-0"; if (d>0) return `D-${d}`; return `D+${Math.abs(d)}`;
}
function getDDayStyle(due, dark) {
  const d = Math.ceil((due - TODAY) / 86400000);
  if (dark) {
    if (d<=0) return { background:"#4A2326", color:"#FCA5A5" };
    if (d<=3) return { background:"#4A3A1F", color:"#FCD34D" };
    return { background:"#1F3A2E", color:"#86EFAC" };
  }
  if (d<=0) return { background:"#FEE2E2", color:"#991B1B" };
  if (d<=3) return { background:"#FEF3C7", color:"#92400E" };
  return { background:"#ECFDF5", color:"#065F46" };
}
function typeStyle(t, dark) {
  const map = dark
    ? { assignment:{bg:"#2C384F",color:"#93C5FD"}, exam:{bg:"#412A36",color:"#FDA4AF"}, personal:{bg:"#3D2E48",color:"#D8B4FE"} }
    : { assignment:{bg:"#EFF6FF",color:"#1D4ED8"}, exam:{bg:"#FFF1F2",color:"#BE123C"}, personal:{bg:"#F5F3FF",color:"#7C3AED"} };
  return map[t] || map.personal;
}
function getWeekDates(base) {
  const d = new Date(base), day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day===0 ? 6 : day-1));
  return Array.from({length:5}, (_,i) => { const dd=new Date(mon); dd.setDate(mon.getDate()+i); return dd; });
}
function getMonthCells(year, month) {
  const first = new Date(year, month, 1), last = new Date(year, month+1, 0);
  const startDay = (first.getDay()+6)%7;
  const cells = [];
  for (let i=0; i<startDay; i++) cells.push(null);
  for (let d=1; d<=last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length%7!==0) cells.push(null);
  return cells;
}

const MOB_TABS = [
  { key:"calendar", label:"캘린더", icon:"🗓" },
  { key:"upcoming",  label:"마감",   icon:"⏰" },
  { key:"courses",   label:"과목",   icon:"📚" },
  { key:"planner",   label:"수업시간표", icon:"📋" },
];

// ── 폰트 크기 단계 ────────────────────────────────────────────────────
const FONT_SIZES = {
  small:  { base:12, sm:10, xs:9,  cellH:48 },
  medium: { base:13, sm:11, xs:10, cellH:60 },
  large:  { base:15, sm:13, xs:11, cellH:78 },
};

export default function TinoPlan({
  userId,
  coursesDB,
  enrolled,
  events,
  setEnrolled,
  setEvents,
  onLogout,
  onLoginClick,
}) {
  // 상위에서 받은 강의 데이터 또는 fallback (개발용 mock)
  const activeCoursesDB = coursesDB && coursesDB.length ? coursesDB : COURSES_DB;

  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(TODAY);
  const [visible, setVisible] = useState({class:true,assignment:true,exam:true,personal:true});
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({title:"",subject:"",date:"",time:"23:59",type:"personal"});

  // ── 설정 ──────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState("medium"); // small | medium | large

  // ── 반응형 ────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [mobTab, setMobTab] = useState("calendar");

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (isMobile && mobTab === "planner") {
      setShowPlanner(true);
      setMobTab("calendar");
    }
  }, [mobTab, isMobile]);

  // 마운트 시 백엔드의 기존 개인 일정 로드 (이전 세션에 저장된 게 있을 수도)
  useEffect(() => {
    if (!userId) return;
    apiGetEvents(userId)
      .then(rows => {
        if (!rows || !rows.length) return;
        const personalEvents = rows.map(transformPersonalEvent);
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const fresh = personalEvents.filter(e => !existingIds.has(e.id));
          return [...prev, ...fresh];
        });
      })
      .catch(err => console.warn("개인 일정 로드 실패:", err.message));
  }, [userId]);

  const fs = FONT_SIZES[fontSize];
  const colorMap = buildColorMap(darkMode, activeCoursesDB);
  const weekDates = getWeekDates(currentDate);
  const monthCells = getMonthCells(currentDate.getFullYear(), currentDate.getMonth());

  function getEnrolledBlocks() {
    if (!visible.class) return [];
    const blocks = [];
    for (const [code, secNo] of Object.entries(enrolled)) {
      const course = activeCoursesDB.find(c => c.code===code);
      if (!course) continue;
      const sec = course.sections.find(s => s.no===secNo);
      if (!sec) continue;
      const col = colorMap[code];
      for (const seg of sec.sched) {
        const di = DAY_IDX[seg.d];
        if (di===undefined) continue;
        blocks.push({ code, title:course.title, day:di, startSlot:seg.s, endSlot:seg.e, room:sec.room, prof:sec.prof, col });
      }
    }
    return blocks;
  }

  function getEnrolledCredits() {
    return Object.keys(enrolled).reduce((acc, code) => {
      const c = activeCoursesDB.find(x => x.code===code);
      return acc + (c ? c.credits : 0);
    }, 0);
  }

  function openAdd(date, hour) {
    const d = date || TODAY;
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const ts = hour !== undefined ? `${String(hour).padStart(2,"0")}:00` : "23:59";
    setForm({title:"",subject:"",date:ds,time:ts,type:"personal"});
    setEditEvent(null); setShowModal(true);
  }
  function openEdit(ev) {
    const d = ev.due;
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const ts = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    setForm({title:ev.title,subject:ev.subject||"",date:ds,time:ts,type:ev.type||"personal"});
    setEditEvent(ev); setShowModal(true);
  }
  async function saveEvent() {
    if (!form.title || !form.date) return;
    const [y,mo,d] = form.date.split("-").map(Number);
    const [h,m] = form.time.split(":").map(Number);
    const due = new Date(y, mo-1, d, h, m);
    const isPersonal = form.type === "personal";

    try {
      if (editEvent) {
        // 수정
        if (isPersonal && typeof editEvent.id === "string") {
          // 백엔드 일정 (id가 uuid 문자열)
          await apiUpdateEvent(editEvent.id, { title: form.title, subject: form.subject, due, type: form.type });
        }
        setEvents(evs => evs.map(e => e.id===editEvent.id ? {...e,title:form.title,subject:form.subject,due,type:form.type} : e));
      } else {
        // 신규 추가
        if (isPersonal && userId) {
          const created = await apiCreateEvent(userId, { title: form.title, subject: form.subject, due, type: form.type });
          setEvents(evs => [...evs, transformPersonalEvent(created)]);
        } else {
          // 백엔드 호출 안 함 (과제/시험 같은 임시 추가)
          setEvents(evs => [...evs, {id:nextId++,title:form.title,subject:form.subject,due,type:form.type}]);
        }
      }
      setShowModal(false);
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  }

  async function deleteEvent(id) {
    try {
      if (typeof id === "string") {
        // 백엔드 일정
        await apiDeleteEvent(id);
      }
      setEvents(evs => evs.filter(e => e.id!==id));
      setShowModal(false);
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  }

  async function handleLogout() {
    if (!window.confirm("로그아웃 하시겠습니까? 입력한 일정은 그대로 유지됩니다.")) return;
    try {
      if (userId) await apiLogout(userId);
    } catch {}
    onLogout && onLogout();
  }
  function prevPeriod() { const d=new Date(currentDate); if(view==="week") d.setDate(d.getDate()-7); else d.setMonth(d.getMonth()-1); setCurrentDate(d); }
  function nextPeriod() { const d=new Date(currentDate); if(view==="week") d.setDate(d.getDate()+7); else d.setMonth(d.getMonth()+1); setCurrentDate(d); }

  const allEvents = events.filter(e => visible[e.type]);
  const upcoming = allEvents.filter(e => e.due >= TODAY).sort((a,b) => a.due-b.due).slice(0,6);
  const enrolledCourses = Object.keys(enrolled).map(code => activeCoursesDB.find(c => c.code===code)).filter(Boolean);
  const blocks = getEnrolledBlocks();

  // ── 모바일 탭 콘텐츠 ─────────────────────────────────────────────
  function MobUpcoming() {
    return (
      <div style={{padding:16}}>
        <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text3)",marginBottom:12,textTransform:"uppercase",letterSpacing:".04em"}}>다가오는 마감</div>
        {upcoming.length===0 && <div style={{fontSize:fs.base,color:"var(--text3)",textAlign:"center",paddingTop:40}}>마감 일정 없음</div>}
        {upcoming.map(ev => (
          <div key={ev.id} onClick={() => openEdit(ev)} style={{background:"var(--card)",border:"0.5px solid var(--border)",borderRadius:12,padding:"12px 14px",marginBottom:10,cursor:"pointer"}}>
            <div style={{fontSize:fs.base,fontWeight:500,color:"var(--text)",marginBottom:4}}>{ev.title}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:fs.sm,color:"var(--text3)"}}>{ev.subject||ev.type}</span>
              <span style={{fontSize:fs.sm,fontWeight:600,padding:"2px 8px",borderRadius:4,...getDDayStyle(ev.due, darkMode)}}>{getDDay(ev.due)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function MobCourses() {
    return (
      <div style={{padding:16}}>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <div style={{flex:1,background:"var(--card)",border:"0.5px solid var(--border)",borderRadius:12,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:fs.sm,color:"var(--text3)",marginBottom:4}}>수강 과목</div>
            <div style={{fontSize:24,fontWeight:700,color:"var(--text)"}}>{enrolledCourses.length}</div>
          </div>
          <div style={{flex:1,background:"var(--card)",border:"0.5px solid var(--border)",borderRadius:12,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:fs.sm,color:"var(--text3)",marginBottom:4}}>총 학점</div>
            <div style={{fontSize:24,fontWeight:700,color:"#6366F1"}}>{getEnrolledCredits()}</div>
          </div>
        </div>
        {enrolledCourses.map(c => {
          const col = colorMap[c.code];
          const sec = c.sections.find(s => s.no===enrolled[c.code]);
          return (
            <div key={c.code} style={{background:"var(--card)",border:`0.5px solid ${col?.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:fs.base,fontWeight:600,color:col?.text}}>{c.title}</span>
                <span style={{fontSize:fs.sm,background:col?.bg,color:col?.text,padding:"2px 8px",borderRadius:4}}>{c.credits}학점</span>
              </div>
              {sec && <div style={{fontSize:fs.sm,color:"var(--text2)"}}>{enrolled[c.code]}분반 · {sec.prof} · {sec.sched.map(s=>`${s.d}${s.s===s.e?s.s:`${s.s}~${s.e}교시`}`).join(", ")}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  // ── 설정 모달 ─────────────────────────────────────────────────────
  function SettingsModal() {
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={() => setShowSettings(false)}>
        <div style={{background:"var(--card)",borderRadius:20,padding:"1.5rem",width:320,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}} onClick={e => e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <h3 style={{fontSize:fs.base+2,fontWeight:700,color:"var(--text)"}}>⚙️ 설정</h3>
            <button onClick={() => setShowSettings(false)} style={{border:"none",background:"none",fontSize:20,color:"var(--text3)",cursor:"pointer"}}>×</button>
          </div>

          {/* 다크모드 */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text3)",marginBottom:10,textTransform:"uppercase",letterSpacing:".04em"}}>테마</div>
            <div style={{display:"flex",gap:8}}>
              {[["light","☀️ 라이트"],["dark","🌙 다크"]].map(([k,label]) => (
                <button key={k} onClick={() => setDarkMode(k==="dark")}
                  style={{flex:1,padding:"10px 0",borderRadius:10,border:`1.5px solid ${(k==="dark")===darkMode?"#6366F1":"var(--border)"}`,background:(k==="dark")===darkMode?(darkMode?"#363555":"#EEF2FF"):"var(--bg2)",color:(k==="dark")===darkMode?(darkMode?"#C7D2FE":"#6366F1"):"var(--text2)",fontWeight:600,fontSize:fs.sm,cursor:"pointer"}}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 폰트 크기 */}
          <div>
            <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text3)",marginBottom:10,textTransform:"uppercase",letterSpacing:".04em"}}>글자 크기</div>
            <div style={{display:"flex",gap:8}}>
              {[["small","작게"],["medium","보통"],["large","크게"]].map(([k,label]) => (
                <button key={k} onClick={() => setFontSize(k)}
                  style={{flex:1,padding:"10px 0",borderRadius:10,border:`1.5px solid ${fontSize===k?"#6366F1":"var(--border)"}`,background:fontSize===k?(darkMode?"#363555":"#EEF2FF"):"var(--bg2)",color:fontSize===k?(darkMode?"#C7D2FE":"#6366F1"):"var(--text2)",fontWeight:600,fontSize:FONT_SIZES[k].base,cursor:"pointer"}}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{marginTop:10,padding:"10px 12px",background:"var(--bg2)",borderRadius:8,fontSize:fs.base,color:"var(--text2)"}}>
              미리보기: 이렇게 보입니다
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",minHeight:"100vh",background:"var(--bg)",color:"var(--text)",display:"flex",flexDirection:"column",fontSize:fs.base}}>
      <style>{`
        :root { ${getThemeVars(darkMode)} }
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;font-family:inherit}
        .icon-btn{border:0.5px solid var(--border);background:var(--card);border-radius:8px;padding:5px 10px;font-size:${fs.sm}px;color:var(--text2);transition:all .15s}
        .icon-btn:hover{background:var(--bg2);color:var(--text)}
        .nav-tab{border:none;background:none;padding:5px 14px;font-size:${fs.sm}px;font-weight:500;color:var(--text2);border-radius:8px;transition:all .15s}
        .nav-tab.active{background:var(--card);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.08)}
        .badge{display:inline-block;font-size:${fs.xs}px;font-weight:600;padding:2px 7px;border-radius:4px}
        .month-day{min-height:80px;padding:4px;border-right:0.5px solid var(--border);border-bottom:0.5px solid var(--border);cursor:pointer;transition:background .1s}
        .month-day:hover{background:var(--hover)}
        .event-card{border-radius:6px;border-left:3px solid;padding:5px 7px;margin-bottom:4px;cursor:pointer;font-size:${fs.sm}px;font-weight:600;line-height:1.4}
        .event-card:hover{opacity:.85}
        .class-block{position:absolute;left:2px;right:2px;border-radius:5px;border-left:3px solid;padding:4px 6px;font-size:${fs.sm}px;font-weight:600;z-index:2;word-break:break-word;line-height:1.3}
        input,select{font-family:inherit;font-size:${fs.base}px;padding:8px 11px;border:0.5px solid var(--input-border);border-radius:8px;background:var(--input-bg);color:var(--text);width:100%;outline:none}
        input:focus,select:focus{border-color:#6366F1;box-shadow:0 0 0 2px rgba(99,102,241,.1)}
        .sidebar-card{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px}
        .sc-label{font-size:${fs.xs}px;font-weight:600;color:var(--text3);margin-bottom:8px;letter-spacing:.03em;text-transform:uppercase}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:${fs.sm}px}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:999;display:flex;align-items:center;justify-content:center}
        .modal{background:var(--card);border-radius:16px;padding:1.5rem;width:340px;max-width:92vw}
        .planner-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:998;display:flex;align-items:flex-start;justify-content:center;padding-top:30px;overflow-y:auto}
        .planner-modal{background:var(--card);border-radius:16px;padding:1.5rem;width:520px;max-width:95vw;max-height:80vh;overflow-y:auto}
        .mob-tabbar{position:fixed;bottom:0;left:0;right:0;height:56px;background:var(--card);border-top:0.5px solid var(--border);display:flex;z-index:200;padding-bottom:env(safe-area-inset-bottom)}
        .mob-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:none;background:none;font-size:${fs.xs}px;color:var(--text3);transition:color .15s}
        .mob-tab.active{color:#6366F1}
        .mob-tab .tab-icon{font-size:18px;line-height:1}
      `}</style>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header style={{background:"var(--header)",borderBottom:"0.5px solid var(--border)",padding:"0 16px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:17,fontWeight:700,color:"#6366F1"}}>Tino</span>
          <span style={{fontSize:17,fontWeight:700,color:"var(--text)"}}>Plan</span>
          {!isMobile && <span style={{fontSize:fs.xs,color:"var(--text2)",background:"var(--bg2)",borderRadius:4,padding:"2px 5px"}}>한국공학대</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!isMobile && (
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:fs.sm,color:darkMode?"#86EFAC":"#065F46",background:darkMode?"#1F3A2E":"#ECFDF5",borderRadius:99,padding:"3px 9px"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10B981",display:"inline-block"}}></span>
              2026-1 강의 데이터
            </div>
          )}
          <button className="icon-btn" onClick={() => openAdd(null)} style={{fontWeight:600,color:"#6366F1",borderColor:"#C7D2FE"}}>+ 일정</button>
          <button className="icon-btn" onClick={() => setShowSettings(true)} style={{padding:"5px 8px"}}>⚙️</button>
          {userId
            ? <button className="icon-btn" onClick={handleLogout} style={{padding:"5px 8px"}} title="로그아웃">⎋</button>
            : <button className="icon-btn" onClick={() => onLoginClick && onLoginClick()} style={{padding:"5px 10px",color:"#6366F1",borderColor:"#C7D2FE",fontWeight:600}} title="로그인">로그인</button>
          }
        </div>
      </header>

      {/* ── 데스크탑 레이아웃 ────────────────────────────────────── */}
      {!isMobile && (
        <div style={{display:"flex",flex:1,padding:12,gap:12,maxWidth:1200,margin:"0 auto",width:"100%"}}>
          <aside style={{width:200,flexShrink:0,display:"flex",flexDirection:"column"}}>
            <div className="sidebar-card">
              <div className="sc-label">이번 학기</div>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <div style={{flex:1,background:"var(--bg2)",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                  <div style={{fontSize:fs.xs,color:"var(--text3)"}}>과목</div>
                  <div style={{fontSize:22,fontWeight:700,color:"var(--text)"}}>{enrolledCourses.length}</div>
                </div>
                <div style={{flex:1,background:"var(--bg2)",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                  <div style={{fontSize:fs.xs,color:"var(--text3)"}}>학점</div>
                  <div style={{fontSize:22,fontWeight:700,color:"#6366F1"}}>{getEnrolledCredits()}</div>
                </div>
              </div>
              {enrolledCourses.map(c => (
                <div key={c.code} style={{display:"flex",alignItems:"center",gap:5,fontSize:fs.sm,color:"var(--text2)",marginBottom:4}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:colorMap[c.code]?.border,flexShrink:0}}></span>
                  {c.title}
                </div>
              ))}
            </div>
            <div className="sidebar-card">
              <div className="sc-label">표시 항목</div>
              {[["class","수업","#10B981"],["assignment","과제","#3B82F6"],["exam","시험","#F43F5E"],["personal","개인일정","#A855F7"]].map(([k,label,color]) => (
                <div key={k} className="toggle-row">
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:9,height:9,borderRadius:"50%",background:color,display:"inline-block"}}></span>
                    <span style={{color:"var(--text)"}}>{label}</span>
                  </div>
                  <button onClick={() => setVisible(v => ({...v,[k]:!v[k]}))} style={{width:34,height:19,borderRadius:99,background:visible[k]?color:"var(--bg3)",border:"none",position:"relative",cursor:"pointer",transition:"background .2s"}}>
                    <div style={{width:13,height:13,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:visible[k]?18:3,transition:"left .2s"}}></div>
                  </button>
                </div>
              ))}
            </div>
            <div className="sidebar-card" style={{flex:1,overflowY:"auto"}}>
              <div className="sc-label">다가오는 마감</div>
              {upcoming.length===0 && <div style={{fontSize:fs.sm,color:"var(--text3)"}}>마감 일정 없음</div>}
              {upcoming.map(ev => (
                <div key={ev.id} onClick={() => openEdit(ev)} style={{marginBottom:10,cursor:"pointer"}}>
                  <div style={{fontSize:fs.sm,fontWeight:500,color:"var(--text)",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:fs.xs,color:"var(--text3)"}}>{ev.subject||ev.type}</span>
                    <span className="badge" style={getDDayStyle(ev.due, darkMode)}>{getDDay(ev.due)}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button className="icon-btn" onClick={() => setCurrentDate(TODAY)} style={{padding:"4px 9px"}}>오늘</button>
                <button className="icon-btn" onClick={prevPeriod}>‹</button>
                <button className="icon-btn" onClick={nextPeriod}>›</button>
                <span style={{fontSize:fs.base+1,fontWeight:600,color:"var(--text)"}}>
                  {view==="week"
                    ? `${weekDates[0].getMonth()+1}월 ${weekDates[0].getDate()}일 — ${weekDates[4].getMonth()+1}월 ${weekDates[4].getDate()}일`
                    : `${currentDate.getFullYear()}년 ${currentDate.getMonth()+1}월`}
                </span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button className="icon-btn" onClick={() => setShowPlanner(true)} style={{color:"#7C3AED",borderColor:"#DDD6FE"}}>📋 수업시간표</button>
                <div style={{display:"flex",background:"var(--bg2)",borderRadius:10,padding:2,gap:1}}>
                  {[["week","주간"],["month","월간"]].map(([k,label]) => (
                    <button key={k} className={`nav-tab${view===k?" active":""}`} onClick={() => setView(k)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{background:"var(--card)",border:"0.5px solid var(--border)",borderRadius:12,overflow:"auto",flex:1}}>
              {view==="week"
                ? <WeekView weekDates={weekDates} allEvents={allEvents} blocks={blocks} onEdit={openEdit} onAdd={openAdd} fs={fs} dark={darkMode} />
                : <MonthView currentDate={currentDate} monthCells={monthCells} allEvents={allEvents} blocks={blocks} onDayClick={d => { setCurrentDate(d); setView("week"); }} onEdit={openEdit} fs={fs} dark={darkMode} />}
            </div>
          </main>
        </div>
      )}

      {/* ── 모바일 레이아웃 ──────────────────────────────────────── */}
      {isMobile && (
        <div style={{flex:1,display:"flex",flexDirection:"column",paddingBottom:56}}>
          {mobTab==="calendar" && (
            <div style={{flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button className="icon-btn" onClick={() => setCurrentDate(TODAY)} style={{padding:"3px 7px"}}>오늘</button>
                  <button className="icon-btn" onClick={prevPeriod} style={{padding:"3px 8px"}}>‹</button>
                  <button className="icon-btn" onClick={nextPeriod} style={{padding:"3px 8px"}}>›</button>
                  <span style={{fontSize:fs.base,fontWeight:600,color:"var(--text)",marginLeft:2}}>
                    {view==="week"
                      ? `${weekDates[0].getMonth()+1}/${weekDates[0].getDate()} — ${weekDates[4].getMonth()+1}/${weekDates[4].getDate()}`
                      : `${currentDate.getFullYear()}년 ${currentDate.getMonth()+1}월`}
                  </span>
                </div>
                <div style={{display:"flex",background:"var(--bg2)",borderRadius:8,padding:2,gap:1}}>
                  {[["week","주간"],["month","월간"]].map(([k,label]) => (
                    <button key={k} className={`nav-tab${view===k?" active":""}`} onClick={() => setView(k)} style={{padding:"3px 10px"}}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{background:"var(--card)",border:"0.5px solid var(--border)",borderRadius:12,overflow:"auto",flex:1,margin:"0 10px 10px"}}>
                {view==="week"
                  ? <WeekView weekDates={weekDates} allEvents={allEvents} blocks={blocks} onEdit={openEdit} onAdd={openAdd} fs={fs} dark={darkMode} />
                  : <MonthView currentDate={currentDate} monthCells={monthCells} allEvents={allEvents} blocks={blocks} onDayClick={d => { setCurrentDate(d); setView("week"); }} onEdit={openEdit} fs={fs} dark={darkMode} />}
              </div>
            </div>
          )}
          {mobTab==="upcoming" && <MobUpcoming />}
          {mobTab==="courses"  && <MobCourses />}
        </div>
      )}

      {/* ── 모바일 하단 탭바 ─────────────────────────────────────── */}
      {isMobile && (
        <nav className="mob-tabbar">
          {MOB_TABS.map(t => (
            <button key={t.key} className={`mob-tab${mobTab===t.key?" active":""}`} onClick={() => setMobTab(t.key)}>
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {/* ── 일정 모달 ────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{fontSize:fs.base+1,fontWeight:600,color:"var(--text)"}}>{editEvent?"일정 수정":"일정 추가"}</h3>
              <button onClick={() => setShowModal(false)} style={{border:"none",background:"none",fontSize:18,color:"var(--text3)",cursor:"pointer"}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              <input placeholder="일정 제목" value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} />
              <input placeholder="과목 / 설명 (선택)" value={form.subject} onChange={e => setForm(f => ({...f,subject:e.target.value}))} />
              <div style={{display:"flex",gap:7}}>
                <input type="date" value={form.date} onChange={e => setForm(f => ({...f,date:e.target.value}))} style={{flex:2}} />
                <input type="time" value={form.time} onChange={e => setForm(f => ({...f,time:e.target.value}))} style={{flex:1}} />
              </div>
              <select value={form.type} onChange={e => setForm(f => ({...f,type:e.target.value}))}>
                <option value="personal">개인 일정</option>
                <option value="assignment">과제</option>
                <option value="exam">시험</option>
              </select>
            </div>
            <div style={{display:"flex",gap:7,marginTop:14}}>
              {editEvent && <button onClick={() => deleteEvent(editEvent.id)} style={{flex:1,padding:"9px 0",border:"0.5px solid #FCA5A5",borderRadius:8,background:"#FFF1F2",color:"#BE123C",fontWeight:500,fontSize:fs.base}}>삭제</button>}
              <button onClick={saveEvent} style={{flex:2,padding:"9px 0",border:"none",borderRadius:8,background:"#6366F1",color:"#fff",fontWeight:600,fontSize:fs.base}}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수업시간표 모달 ──────────────────────────────────────── */}
      {showPlanner && (
        <div className="planner-overlay" onClick={() => setShowPlanner(false)}>
          <div className="planner-modal" onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{fontSize:fs.base+1,fontWeight:600,color:"var(--text)"}}>수업시간표 — 분반 선택</h3>
              <button onClick={() => setShowPlanner(false)} style={{border:"none",background:"none",fontSize:18,color:"var(--text3)",cursor:"pointer"}}>×</button>
            </div>
            <div style={{fontSize:fs.sm,color:"var(--text2)",marginBottom:12,background:"var(--bg2)",padding:"8px 10px",borderRadius:8}}>
              분반을 선택하면 시간표에 바로 반영됩니다.
            </div>
            {(() => {
              // 학년 정보가 있으면 학년별 그룹, 없으면 전체 한 그룹
              const hasGrade = activeCoursesDB.some(c => c.grade > 0);
              const groups = hasGrade
                ? [1,2,3,4].map(g => ({ label: `${g}학년`, items: activeCoursesDB.filter(c => c.grade === g) }))
                : [{ label: "수강 과목", items: activeCoursesDB }];
              return groups.map((group, gi) => {
                if (!group.items.length) return null;
                return (
                  <div key={gi} style={{marginBottom:14}}>
                    <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text3)",marginBottom:6}}>{group.label}</div>
                    {group.items.map(course => {
                      const col = colorMap[course.code];
                      const cur = enrolled[course.code];
                      return (
                        <div key={course.code} style={{marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:col?.border,flexShrink:0}}></span>
                            <span style={{fontSize:fs.base,fontWeight:500,color:"var(--text)"}}>{course.title}</span>
                            <span style={{fontSize:fs.xs,color:"var(--text3)"}}>{course.type} · {course.credits}학점</span>
                            {cur && <span style={{fontSize:fs.xs,color:darkMode?"#86EFAC":"#065F46",background:darkMode?"#1F3A2E":"#ECFDF5",padding:"1px 6px",borderRadius:3}}>✓ {cur}분반</span>}
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            <button onClick={() => setEnrolled(e => { const n={...e}; delete n[course.code]; return n; })} style={{fontSize:fs.xs,padding:"4px 8px",border:"0.5px solid var(--border)",borderRadius:6,background:"var(--bg2)",color:"var(--text2)",cursor:"pointer"}}>미수강</button>
                            {course.sections.filter(s => s.sched.length).map(sec => {
                              const schedStr = sec.sched.map(s => `${s.d}${s.s===s.e?s.s:`${s.s}~${s.e}`}`).join(" ");
                              const isSel = cur===sec.no;
                              return (
                                <button key={sec.no} onClick={() => setEnrolled(e => ({...e,[course.code]:sec.no}))}
                                  style={{fontSize:fs.xs,padding:"4px 8px",border:isSel?`1.5px solid ${col?.border}`:"0.5px solid var(--border)",borderRadius:6,background:isSel?col?.bg:"var(--card)",color:isSel?col?.text:"var(--text2)",cursor:"pointer"}}>
                                  {sec.no}분반 {sec.prof||""} ({schedStr})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
            <button onClick={() => setShowPlanner(false)} style={{width:"100%",padding:"10px 0",border:"none",borderRadius:8,background:"#6366F1",color:"#fff",fontWeight:600,fontSize:fs.base,marginTop:4}}>완료</button>
          </div>
        </div>
      )}

      {/* ── 설정 모달 ────────────────────────────────────────────── */}
      {showSettings && <SettingsModal />}
    </div>
  );
}

function WeekView({ weekDates, allEvents, blocks, onEdit, onAdd, fs, dark }) {
  return (
    <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
      <colgroup>
        <col style={{width:36}} />
        {weekDates.map((_,i) => <col key={i} />)}
      </colgroup>
      <thead>
        <tr style={{borderBottom:"0.5px solid var(--border)"}}>
          <th></th>
          {weekDates.map((d,i) => {
            const isT = sameDay(d, TODAY);
            return (
              <th key={i} style={{padding:"7px 2px",textAlign:"center",fontWeight:500}}>
                <div style={{fontSize:fs.xs,color:"var(--text3)",marginBottom:2}}>{DAY_KO[i]}</div>
                <div style={{width:26,height:26,borderRadius:"50%",background:isT?"#6366F1":"transparent",color:isT?"#fff":"var(--text)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs.sm,fontWeight:isT?700:400,margin:"0 auto"}}>{d.getDate()}</div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {HOURS.map(hour => (
          <tr key={hour} style={{borderBottom:"0.5px solid var(--border)"}}>
            <td style={{padding:"0 4px",textAlign:"right",fontSize:fs.xs,color:"var(--text3)",verticalAlign:"top",paddingTop:4,height:fs.cellH}}>{hour}</td>
            {weekDates.map((d,di) => {
              const dayEvs = allEvents
                .filter(e => sameDay(e.due,d) && (e.due.getHours()===hour || (hour===9&&e.due.getHours()<9) || (hour===22&&e.due.getHours()>22)))
                .sort((a,b) => a.due-b.due);
              const dayBlocks = blocks.filter(b => b.day===di && SLOT_HOUR[b.startSlot]===hour);
              const hasEvs = dayEvs.length > 0;
              return (
                <td key={di} onClick={() => onAdd(d,hour)} style={{borderRight:"0.5px solid var(--border)",minHeight:fs.cellH,height:hasEvs?undefined:fs.cellH,verticalAlign:"top",padding:2,position:"relative"}}>
                  {dayBlocks.map(b => (
                    <div key={b.code+b.startSlot} className="class-block" style={{background:b.col.bg,borderLeftColor:b.col.border,color:b.col.text,height:(b.endSlot-b.startSlot+1)*fs.cellH-6,top:3}}>
                      <div>{b.title}</div>
                      <div style={{fontSize:fs.xs,opacity:.75}}>{b.room}</div>
                      <div style={{fontSize:fs.xs,opacity:.6}}>{b.prof}</div>
                    </div>
                  ))}
                  {hasEvs && (
                    <div style={{marginTop: dayBlocks.length ? 4 : 0}}>
                      {dayEvs.map(ev => {
                        const ts = typeStyle(ev.type, dark);
                        const typeLabel = {assignment:"과제",exam:"시험",personal:"개인일정"}[ev.type]||ev.type;
                        const timeStr = `${String(ev.due.getHours()).padStart(2,"0")}:${String(ev.due.getMinutes()).padStart(2,"0")}`;
                        return (
                          <div key={ev.id} className="event-card" onClick={e => {e.stopPropagation();onEdit(ev);}}
                            style={{background:ts.bg,color:ts.color,borderLeftColor:ts.color}}>
                            <div style={{wordBreak:"break-word"}}>{ev.title}</div>
                            {ev.subject && <div style={{fontSize:fs.xs,opacity:.75,wordBreak:"break-word"}}>{ev.subject}</div>}
                            <div style={{fontSize:fs.xs,opacity:.6}}>{timeStr} · {typeLabel}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MonthView({ currentDate, monthCells, allEvents, blocks, onDayClick, onEdit, fs, dark }) {
  const dayNames = ["월","화","수","목","금","토","일"];
  const rows = [];
  for (let i=0; i<monthCells.length; i+=7) rows.push(monthCells.slice(i,i+7));
  const mo = currentDate.getMonth();
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"0.5px solid var(--border)"}}>
        {dayNames.map((d,i) => (
          <div key={i} style={{textAlign:"center",padding:"6px 0",fontSize:fs.sm,fontWeight:500,color:i>=5?"#F43F5E":"var(--text3)",borderRight:i<6?"0.5px solid var(--border)":"none"}}>{d}</div>
        ))}
      </div>
      {rows.map((row,ri) => (
        <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {row.map((date,ci) => {
            const isT = date && sameDay(date, TODAY);
            const isCur = date && date.getMonth()===mo;
            const evs = date ? allEvents.filter(e => sameDay(e.due,date)) : [];
            const dayBlocks = date&&ci<5 ? [...new Map(blocks.filter(b=>b.day===ci).map(b=>[b.code,b])).values()] : [];
            const extraCount = Math.max(0,dayBlocks.length-1) + Math.max(0,evs.length-2);
            return (
              <div key={ci} className="month-day" onClick={() => date&&onDayClick(date)} style={{borderRight:ci<6?"0.5px solid var(--border)":"none",opacity:!date||!isCur?0.3:1}}>
                {date && (
                  <>
                    <div style={{width:22,height:22,borderRadius:"50%",background:isT?"#6366F1":"transparent",color:isT?"#fff":"var(--text)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs.sm,fontWeight:isT?700:400,marginBottom:2}}>{date.getDate()}</div>
                    {dayBlocks.slice(0,1).map(b => (
                      <div key={b.code} style={{borderRadius:4,padding:"2px 5px",fontSize:fs.xs,fontWeight:500,background:b.col.bg,color:b.col.text,wordBreak:"break-word",marginBottom:2}}>{b.title}</div>
                    ))}
                    {evs.slice(0,2).map(ev => {
                      const ts = typeStyle(ev.type, dark);
                      return (
                        <div key={ev.id} onClick={e=>{e.stopPropagation();onEdit(ev);}}
                          style={{borderRadius:4,padding:"2px 5px",fontSize:fs.xs,fontWeight:500,background:ts.bg,color:ts.color,borderLeft:`2px solid ${ts.color}`,wordBreak:"break-word",marginBottom:2,cursor:"pointer"}}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {extraCount > 0 && <div style={{fontSize:fs.xs,color:"var(--text3)"}}>+{extraCount}개</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}