import { useState, useEffect } from "react";

const BASE_URL = "https://eclass.tukorea.ac.kr";
const TODAY = new Date(2026, 4, 28);
const DAY_KO = ["월", "화", "수", "목", "금"];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const CELL_H = 52;

const SLOT_HOUR = {1:9,2:10,3:11,4:12,5:13,6:14,7:15,8:16,9:17,10:18,11:19};

const SUBJ_COLORS = [
  { bg:"#EEF2FF", border:"#6366F1", text:"#3730A3" },
  { bg:"#ECFDF5", border:"#10B981", text:"#065F46" },
  { bg:"#FFF7ED", border:"#F97316", text:"#9A3412" },
  { bg:"#FDF4FF", border:"#A855F7", text:"#6B21A8" },
  { bg:"#EFF6FF", border:"#3B82F6", text:"#1E40AF" },
  { bg:"#FFF1F2", border:"#F43F5E", text:"#9F1239" },
  { bg:"#F0FDF4", border:"#22C55E", text:"#14532D" },
  { bg:"#FEFCE8", border:"#EAB308", text:"#713F12" },
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

const SUBJ_COLOR_MAP = {};
COURSES_DB.forEach((c,i) => { SUBJ_COLOR_MAP[c.code] = SUBJ_COLORS[i % SUBJ_COLORS.length]; });
const DAY_IDX = {월:0,화:1,수:2,목:3,금:4};

let nextId = 200;

function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function getDDay(due) {
  const d = Math.ceil((due - TODAY) / 86400000);
  if (d===0) return "D-0";
  if (d>0) return `D-${d}`;
  return `D+${Math.abs(d)}`;
}
function getDDayStyle(due) {
  const d = Math.ceil((due - TODAY) / 86400000);
  if (d<=0) return { background:"#FEE2E2", color:"#991B1B" };
  if (d<=3) return { background:"#FEF3C7", color:"#92400E" };
  return { background:"#ECFDF5", color:"#065F46" };
}
function typeStyle(t) {
  return { assignment:{bg:"#EFF6FF",color:"#1D4ED8"}, exam:{bg:"#FFF1F2",color:"#BE123C"}, personal:{bg:"#F5F3FF",color:"#7C3AED"} }[t] || {bg:"#F5F3FF",color:"#7C3AED"};
}
function getWeekDates(base) {
  const d = new Date(base), day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day===0 ? 6 : day-1));
  return Array.from({length:5}, (_,i) => { const dd=new Date(mon); dd.setDate(mon.getDate()+i); return dd; });
}
function getMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month+1, 0);
  const startDay = (first.getDay()+6)%7;
  const cells = [];
  for (let i=0; i<startDay; i++) cells.push(null);
  for (let d=1; d<=last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length%7!==0) cells.push(null);
  return cells;
}

export default function TinoPlan() {
  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(TODAY);
  const [events, setEvents] = useState([
    {id:101,title:"[과제] 알고리즘 프로그래밍",subject:"알고리즘",due:new Date(2026,4,29,23,59),type:"assignment"},
    {id:102,title:"[프로젝트] 개발계획서",subject:"소프트웨어공학",due:new Date(2026,5,5,23,59),type:"assignment"},
    {id:103,title:"[시험] 기말고사",subject:"운영체제",due:new Date(2026,5,10,17,25),type:"exam"},
    {id:104,title:"[시험] 기말고사",subject:"알고리즘",due:new Date(2026,5,12,13,30),type:"exam"},
    {id:105,title:"팀 프로젝트 회의",subject:"",due:new Date(2026,4,29,15,0),type:"personal"},
  ]);
  const [enrolled, setEnrolled] = useState({
    "AAK10070":"02","ACS33010":"11","ACS30010":"02","ACS20021":"11","ACS24013":"02","ACS10022":"01","ACS22021":"01"
  });
  const [visible, setVisible] = useState({class:true,assignment:true,exam:true,personal:true});
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [form, setForm] = useState({title:"",subject:"",date:"",time:"23:59",type:"personal"});

  const weekDates = getWeekDates(currentDate);
  const monthCells = getMonthCells(currentDate.getFullYear(), currentDate.getMonth());

  function getEnrolledBlocks() {
    if (!visible.class) return [];
    const blocks = [];
    for (const [code, secNo] of Object.entries(enrolled)) {
      const course = COURSES_DB.find(c => c.code===code);
      if (!course) continue;
      const sec = course.sections.find(s => s.no===secNo);
      if (!sec) continue;
      const col = SUBJ_COLOR_MAP[code];
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
      const c = COURSES_DB.find(x => x.code===code);
      return acc + (c ? c.credits : 0);
    }, 0);
  }

  function openAdd(date, hour) {
    const d = date || TODAY;
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const ts = hour !== undefined ? `${String(hour).padStart(2,"0")}:00` : "23:59";
    setForm({title:"",subject:"",date:ds,time:ts,type:"personal"});
    setEditEvent(null);
    setShowModal(true);
  }

  function openEdit(ev) {
    const d = ev.due;
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const ts = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    setForm({title:ev.title,subject:ev.subject||"",date:ds,time:ts,type:ev.type||"personal"});
    setEditEvent(ev);
    setShowModal(true);
  }

  function saveEvent() {
    if (!form.title || !form.date) return;
    const [y,mo,d] = form.date.split("-").map(Number);
    const [h,m] = form.time.split(":").map(Number);
    const due = new Date(y, mo-1, d, h, m);
    if (editEvent) {
      setEvents(evs => evs.map(e => e.id===editEvent.id ? {...e,title:form.title,subject:form.subject,due,type:form.type} : e));
    } else {
      setEvents(evs => [...evs, {id:nextId++,title:form.title,subject:form.subject,due,type:form.type}]);
    }
    setShowModal(false);
  }

  function deleteEvent(id) {
    setEvents(evs => evs.filter(e => e.id!==id));
    setShowModal(false);
  }

  function prevPeriod() {
    const d = new Date(currentDate);
    if (view==="week") d.setDate(d.getDate()-7); else d.setMonth(d.getMonth()-1);
    setCurrentDate(d);
  }
  function nextPeriod() {
    const d = new Date(currentDate);
    if (view==="week") d.setDate(d.getDate()+7); else d.setMonth(d.getMonth()+1);
    setCurrentDate(d);
  }

  const allEvents = events.filter(e => visible[e.type]);
  const upcoming = allEvents.filter(e => e.due >= TODAY).sort((a,b) => a.due-b.due).slice(0,6);
  const enrolledCourses = Object.keys(enrolled).map(code => COURSES_DB.find(c => c.code===code)).filter(Boolean);
  const blocks = getEnrolledBlocks();

  return (
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",minHeight:"100vh",background:"#F8FAFC",display:"flex",flexDirection:"column"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;font-family:inherit}
        .icon-btn{border:0.5px solid #E2E8F0;background:#fff;border-radius:8px;padding:5px 10px;font-size:13px;color:#64748B;transition:all .15s}
        .icon-btn:hover{background:#F1F5F9;color:#1E293B}
        .nav-tab{border:none;background:none;padding:5px 14px;font-size:13px;font-weight:500;color:#64748B;border-radius:8px;transition:all .15s}
        .nav-tab.active{background:#fff;color:#1E293B;box-shadow:0 1px 3px rgba(0,0,0,.08)}
        .badge{display:inline-block;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px}
        .month-day{min-height:80px;padding:4px;border-right:0.5px solid #E2E8F0;border-bottom:0.5px solid #E2E8F0;cursor:pointer;transition:background .1s}
        .month-day:hover{background:#F8FAFC}
        .event-chip{border-radius:4px;padding:2px 5px;font-size:10px;font-weight:500;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px;display:block}
        .event-chip:hover{opacity:.82}
        .class-block{position:absolute;left:2px;right:2px;border-radius:5px;border-left:3px solid;padding:3px 5px;overflow:hidden;font-size:10px;font-weight:600;z-index:2}
        input,select{font-family:inherit;font-size:13px;padding:7px 11px;border:0.5px solid #CBD5E1;border-radius:8px;background:#fff;color:#1E293B;width:100%;outline:none}
        input:focus,select:focus{border-color:#6366F1;box-shadow:0 0 0 2px rgba(99,102,241,.1)}
        .sidebar-card{background:#fff;border:0.5px solid #E2E8F0;border-radius:12px;padding:12px;margin-bottom:10px}
        .sc-label{font-size:11px;font-weight:600;color:#94A3B8;margin-bottom:8px;letter-spacing:.03em;text-transform:uppercase}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12px}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:999;display:flex;align-items:center;justify-content:center}
        .modal{background:#fff;border-radius:16px;padding:1.5rem;width:340px;max-width:92vw}
        .planner-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:998;display:flex;align-items:flex-start;justify-content:center;padding-top:30px}
        .planner-modal{background:#fff;border-radius:16px;padding:1.5rem;width:520px;max-width:95vw;max-height:80vh;overflow-y:auto}
      `}</style>

      {/* Header */}
      <header style={{background:"#fff",borderBottom:"0.5px solid #E2E8F0",padding:"0 16px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:17,fontWeight:700,color:"#6366F1"}}>Tino</span>
          <span style={{fontSize:17,fontWeight:700,color:"#1E293B"}}>Plan</span>
          <span style={{fontSize:10,color:"#64748B",background:"#F1F5F9",borderRadius:4,padding:"2px 5px"}}>한국공학대</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#065F46",background:"#ECFDF5",borderRadius:99,padding:"3px 9px"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#10B981",display:"inline-block"}}></span>
            2026-1 강의 데이터
          </div>
          <button className="icon-btn" onClick={() => openAdd(null)} style={{fontWeight:600,color:"#6366F1",borderColor:"#C7D2FE",fontSize:12}}>+ 일정</button>
        </div>
      </header>

      <div style={{display:"flex",flex:1,padding:12,gap:12,maxWidth:1200,margin:"0 auto",width:"100%"}}>
        {/* Sidebar */}
        <aside style={{width:190,flexShrink:0,display:"flex",flexDirection:"column"}}>
          <div className="sidebar-card">
            <div className="sc-label">이번 학기</div>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <div style={{flex:1,background:"#F8FAFC",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#94A3B8"}}>과목</div>
                <div style={{fontSize:20,fontWeight:700,color:"#1E293B"}}>{enrolledCourses.length}</div>
              </div>
              <div style={{flex:1,background:"#F8FAFC",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#94A3B8"}}>학점</div>
                <div style={{fontSize:20,fontWeight:700,color:"#6366F1"}}>{getEnrolledCredits()}</div>
              </div>
            </div>
            {enrolledCourses.map(c => (
              <div key={c.code} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#64748B",marginBottom:3}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:SUBJ_COLOR_MAP[c.code]?.border,flexShrink:0}}></span>
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
                  <span style={{color:"#1E293B"}}>{label}</span>
                </div>
                <button onClick={() => setVisible(v => ({...v,[k]:!v[k]}))} style={{width:32,height:18,borderRadius:99,background:visible[k]?color:"#E2E8F0",border:"none",position:"relative",cursor:"pointer",transition:"background .2s"}}>
                  <div style={{width:12,height:12,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:visible[k]?17:3,transition:"left .2s"}}></div>
                </button>
              </div>
            ))}
          </div>

          <div className="sidebar-card" style={{flex:1,overflowY:"auto"}}>
            <div className="sc-label">다가오는 마감</div>
            {upcoming.length===0 && <div style={{fontSize:12,color:"#94A3B8"}}>마감 일정 없음</div>}
            {upcoming.map(ev => (
              <div key={ev.id} onClick={() => openEdit(ev)} style={{marginBottom:8,cursor:"pointer"}}>
                <div style={{fontSize:11,fontWeight:500,color:"#1E293B",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:10,color:"#94A3B8"}}>{ev.subject||ev.type}</span>
                  <span className="badge" style={getDDayStyle(ev.due)}>{getDDay(ev.due)}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button className="icon-btn" onClick={() => setCurrentDate(TODAY)} style={{fontSize:12,padding:"4px 9px"}}>오늘</button>
              <button className="icon-btn" onClick={prevPeriod}>‹</button>
              <button className="icon-btn" onClick={nextPeriod}>›</button>
              <span style={{fontSize:14,fontWeight:600,color:"#1E293B"}}>
                {view==="week"
                  ? `${weekDates[0].getMonth()+1}월 ${weekDates[0].getDate()}일 — ${weekDates[4].getMonth()+1}월 ${weekDates[4].getDate()}일`
                  : `${currentDate.getFullYear()}년 ${currentDate.getMonth()+1}월`}
              </span>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button className="icon-btn" onClick={() => setShowPlanner(true)} style={{fontSize:12,color:"#7C3AED",borderColor:"#DDD6FE"}}>📋 수강 설계</button>
              <div style={{display:"flex",background:"#F1F5F9",borderRadius:10,padding:2,gap:1}}>
                {[["week","주간"],["month","월간"]].map(([k,label]) => (
                  <button key={k} className={`nav-tab${view===k?" active":""}`} onClick={() => setView(k)}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{background:"#fff",border:"0.5px solid #E2E8F0",borderRadius:12,overflow:"auto",flex:1}}>
            {view==="week" ? (
              <WeekView weekDates={weekDates} allEvents={allEvents} blocks={blocks} onEdit={openEdit} onAdd={openAdd} />
            ) : (
              <MonthView currentDate={currentDate} monthCells={monthCells} allEvents={allEvents} blocks={blocks} onDayClick={d => { setCurrentDate(d); setView("week"); }} onEdit={openEdit} />
            )}
          </div>
        </main>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{fontSize:15,fontWeight:600,color:"#1E293B"}}>{editEvent?"일정 수정":"일정 추가"}</h3>
              <button onClick={() => setShowModal(false)} style={{border:"none",background:"none",fontSize:18,color:"#64748B",cursor:"pointer"}}>×</button>
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
              {editEvent && <button onClick={() => deleteEvent(editEvent.id)} style={{flex:1,padding:"8px 0",border:"0.5px solid #FCA5A5",borderRadius:8,background:"#FFF1F2",color:"#BE123C",fontWeight:500,fontSize:13}}>삭제</button>}
              <button onClick={saveEvent} style={{flex:2,padding:"8px 0",border:"none",borderRadius:8,background:"#6366F1",color:"#fff",fontWeight:600,fontSize:13}}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Planner Modal */}
      {showPlanner && (
        <div className="planner-overlay" onClick={() => setShowPlanner(false)}>
          <div className="planner-modal" onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{fontSize:15,fontWeight:600,color:"#1E293B"}}>수강 설계 — 분반 선택</h3>
              <button onClick={() => setShowPlanner(false)} style={{border:"none",background:"none",fontSize:18,color:"#64748B",cursor:"pointer"}}>×</button>
            </div>
            <div style={{fontSize:11,color:"#64748B",marginBottom:12,background:"#F8FAFC",padding:"8px 10px",borderRadius:8}}>
              분반을 선택하면 시간표에 바로 반영됩니다.
            </div>
            {[1,2,3,4].map(grade => {
              const cs = COURSES_DB.filter(c => c.grade===grade);
              if (!cs.length) return null;
              return (
                <div key={grade} style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:6}}>{grade}학년</div>
                  {cs.map(course => {
                    const col = SUBJ_COLOR_MAP[course.code];
                    const cur = enrolled[course.code];
                    return (
                      <div key={course.code} style={{marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:col?.border,flexShrink:0}}></span>
                          <span style={{fontSize:13,fontWeight:500,color:"#1E293B"}}>{course.title}</span>
                          <span style={{fontSize:10,color:"#94A3B8"}}>{course.type} · {course.credits}학점</span>
                          {cur && <span style={{fontSize:10,color:"#065F46",background:"#ECFDF5",padding:"1px 6px",borderRadius:3}}>✓ {cur}분반</span>}
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          <button onClick={() => setEnrolled(e => { const n={...e}; delete n[course.code]; return n; })} style={{fontSize:10,padding:"4px 8px",border:"0.5px solid #E2E8F0",borderRadius:6,background:!cur?"#F8FAFC":"#fff",color:"#64748B",cursor:"pointer"}}>미수강</button>
                          {course.sections.filter(s => s.sched.length).map(sec => {
                            const schedStr = sec.sched.map(s => `${s.d}${s.s===s.e?s.s:`${s.s}~${s.e}`}`).join(" ");
                            const isSel = cur===sec.no;
                            return (
                              <button key={sec.no} onClick={() => setEnrolled(e => ({...e,[course.code]:sec.no}))} style={{fontSize:10,padding:"4px 8px",border:isSel?`1.5px solid ${col?.border}`:"0.5px solid #E2E8F0",borderRadius:6,background:isSel?col?.bg:"#fff",color:isSel?col?.text:"#64748B",cursor:"pointer"}}>
                                {sec.no}분반 {sec.prof} ({schedStr})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <button onClick={() => setShowPlanner(false)} style={{width:"100%",padding:"9px 0",border:"none",borderRadius:8,background:"#6366F1",color:"#fff",fontWeight:600,fontSize:13,marginTop:4}}>완료</button>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekView({ weekDates, allEvents, blocks, onEdit, onAdd }) {
  return (
    <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
      <colgroup>
        <col style={{width:44}} />
        {weekDates.map((_,i) => <col key={i} />)}
      </colgroup>
      <thead>
        <tr style={{borderBottom:"0.5px solid #E2E8F0"}}>
          <th></th>
          {weekDates.map((d,i) => {
            const isT = sameDay(d, TODAY);
            return (
              <th key={i} style={{padding:"7px 3px",textAlign:"center",fontWeight:500}}>
                <div style={{fontSize:10,color:"#94A3B8",marginBottom:2}}>{DAY_KO[i]}</div>
                <div style={{width:26,height:26,borderRadius:"50%",background:isT?"#6366F1":"transparent",color:isT?"#fff":"#1E293B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:isT?700:400,margin:"0 auto"}}>{d.getDate()}</div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {HOURS.map(hour => (
          <tr key={hour} style={{borderBottom:"0.5px solid #E2E8F0"}}>
            <td style={{padding:"0 5px",textAlign:"right",fontSize:10,color:"#94A3B8",verticalAlign:"top",paddingTop:3,height:CELL_H}}>{hour}:00</td>
            {weekDates.map((d,di) => {
              const dayEvs = allEvents
  .filter(e => sameDay(e.due,d) && (e.due.getHours()===hour || (hour===9 && e.due.getHours()<9) || (hour===22 && e.due.getHours()>22)))
  .sort((a,b) => a.due - b.due);
              const dayBlocks = blocks.filter(b => b.day===di && SLOT_HOUR[b.startSlot]===hour);
              return (
                <td key={di} onClick={() => onAdd(d, hour)} style={{borderRight:"0.5px solid #E2E8F0",height:CELL_H,verticalAlign:"top",padding:2,position:"relative"}}>
                  {dayBlocks.map(b => (
                    <div key={b.code+b.startSlot} className="class-block" style={{background:b.col.bg,borderLeftColor:b.col.border,color:b.col.text,height:(b.endSlot-b.startSlot+1)*CELL_H-6,top:3}}>
                      <div>{b.title}</div>
                      <div style={{fontSize:9,opacity:.75}}>{b.room}</div>
                      <div style={{fontSize:9,opacity:.6}}>{b.prof}</div>
                    </div>
                  ))}
                  {dayEvs.map(ev => {
                    const ts = typeStyle(ev.type);
                    return <div key={ev.id} className="event-chip" onClick={e => {e.stopPropagation();onEdit(ev);}} style={{background:ts.bg,color:ts.color}}>{ev.title}</div>;
                  })}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MonthView({ currentDate, monthCells, allEvents, blocks, onDayClick, onEdit }) {
  const dayNames = ["월","화","수","목","금","토","일"];
  const rows = [];
  for (let i=0; i<monthCells.length; i+=7) rows.push(monthCells.slice(i,i+7));
  const mo = currentDate.getMonth();

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"0.5px solid #E2E8F0"}}>
        {dayNames.map((d,i) => (
          <div key={i} style={{textAlign:"center",padding:"6px 0",fontSize:11,fontWeight:500,color:i>=5?"#F43F5E":"#94A3B8",borderRight:i<6?"0.5px solid #E2E8F0":"none"}}>{d}</div>
        ))}
      </div>
      {rows.map((row,ri) => (
        <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {row.map((date,ci) => {
            const isT = date && sameDay(date, TODAY);
            const isCur = date && date.getMonth()===mo;
            const evs = date ? allEvents.filter(e => sameDay(e.due,date)) : [];
            const dayBlocks = date && ci<5 ? [...new Map(blocks.filter(b => b.day===ci).map(b => [b.code,b])).values()] : [];
            return (
              <div key={ci} className="month-day" onClick={() => date && onDayClick(date)} style={{borderRight:ci<6?"0.5px solid #E2E8F0":"none",opacity:!date||!isCur?0.3:1}}>
                {date && (
                  <>
                    <div style={{width:22,height:22,borderRadius:"50%",background:isT?"#6366F1":"transparent",color:isT?"#fff":"#1E293B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:isT?700:400,marginBottom:2}}>{date.getDate()}</div>
                    {dayBlocks.slice(0,1).map(b => (
                      <div key={b.code} className="event-chip" style={{background:b.col.bg,color:b.col.text,fontSize:9}}>{b.title}</div>
                    ))}
                    {evs.slice(0,2).map(ev => {
                      const ts = typeStyle(ev.type);
                      return <div key={ev.id} className="event-chip" onClick={e => {e.stopPropagation();onEdit(ev);}} style={{background:ts.bg,color:ts.color,fontSize:9}}>{ev.title.length>10?ev.title.slice(0,10)+"…":ev.title}</div>;
                    })}
                    {(dayBlocks.length-1+Math.max(0,evs.length-2))>0 && <div style={{fontSize:9,color:"#94A3B8"}}>+{dayBlocks.length-1+Math.max(0,evs.length-2)}개</div>}
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
