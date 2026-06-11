import { useState, useMemo, useCallback, useEffect } from "react";

const DAYS = ["월", "화", "수", "목", "금"];

const DEPT_MAP = {
  AAK:"교양", AAC:"첨단융합대학", AFE:"융합공학", AAJ:"공학혁신(EH/ER)", AIR:"기타",
  ACS:"컴퓨터공학부", AIN:"인공지능학과", ASW:"AI·SW전공탐색",
  AEE:"전자공학부", AEN:"반도체공학부", ANS:"나노반도체공학", ASC:"IT반도체융합대학",
  AMC:"스마트기계융합대학", AME:"기계공학부", AMD:"기계설계공학부", AMM:"메카트로닉스공학부", AGL:"스마트기계융합",
  ACH:"생명화학공학과", AMT:"신소재공학과", AEB:"에너지·전기공학부",
  ADE:"디자인공학부", AAE:"경영학부", CAI:"지식융합학부", CCD:"지식융합학부",
};
const getDept = (code) => DEPT_MAP[code?.slice(0,3)] ?? code?.slice(0,3) ?? "";

const DEPT_OPTIONS = [
  { prefix:"ACS", label:"컴퓨터공학부" }, { prefix:"AIN", label:"인공지능학과" },
  { prefix:"AEE", label:"전자공학부" },   { prefix:"AEN", label:"반도체공학부" },
  { prefix:"AME", label:"기계공학부" },   { prefix:"AMD", label:"기계설계공학부" },
  { prefix:"AMM", label:"메카트로닉스공학부" }, { prefix:"AEB", label:"에너지·전기공학부" },
  { prefix:"ADE", label:"디자인공학부" }, { prefix:"AAE", label:"경영학부" },
  { prefix:"ACH", label:"생명화학공학과" }, { prefix:"AMT", label:"신소재공학과" },
];

const PALETTES = {
  light: [
    {bg:"#EEF2FF",text:"#6366F1",border:"#C7D2FE"},{bg:"#FEF3C7",text:"#D97706",border:"#FCD34D"},
    {bg:"#DCFCE7",text:"#16A34A",border:"#86EFAC"},{bg:"#FCE7F3",text:"#DB2777",border:"#FBCFE8"},
    {bg:"#E0F2FE",text:"#0284C7",border:"#7DD3FC"},{bg:"#FEE2E2",text:"#DC2626",border:"#FCA5A5"},
    {bg:"#F3E8FF",text:"#9333EA",border:"#D8B4FE"},{bg:"#FFEDD5",text:"#EA580C",border:"#FDBA74"},
  ],
  dark: [
    {bg:"#1e1b4b",text:"#A5B4FC",border:"#4338CA"},{bg:"#292524",text:"#FCD34D",border:"#92400E"},
    {bg:"#052e16",text:"#86EFAC",border:"#166534"},{bg:"#500724",text:"#FBCFE8",border:"#9D174D"},
    {bg:"#082f49",text:"#7DD3FC",border:"#0369A1"},{bg:"#450a0a",text:"#FCA5A5",border:"#991B1B"},
    {bg:"#3b0764",text:"#D8B4FE",border:"#7E22CE"},{bg:"#431407",text:"#FDBA74",border:"#C2410C"},
  ],
};

function schedsConflict(s1, s2) {
  for (const a of s1) for (const b of s2)
    if (a.d === b.d && !(a.e < b.s || a.s > b.e)) return true;
  return false;
}

function scoreResult(result, noDays, minCredits, maxCredits) {
  let score = 0;
  const target = (minCredits + maxCredits) / 2;
  score += 80 - Math.abs(result.credits - target) * 15;
  for (const d of noDays)
    if (!result.slots.some(s => s.d === d)) score += 60;
  for (const d of DAYS) {
    const segs = result.slots.filter(s => s.d === d).sort((a,b) => a.s - b.s);
    if (segs.length < 2) continue;
    let maxRun = segs[0].e - segs[0].s + 1, run = maxRun;
    for (let i = 1; i < segs.length; i++) {
      if (segs[i].s <= segs[i-1].e + 1) { run += segs[i].e - Math.max(segs[i].s, segs[i-1].e+1) + 1; maxRun = Math.max(maxRun, run); }
      else run = segs[i].e - segs[i].s + 1;
    }
    if (maxRun >= 4) score -= 15 * (maxRun - 3);
  }
  score -= result.slots.filter(s => s.s <= 2).length * 10;
  score -= result.slots.filter(s => s.e >= 11).length * 8;
  return score;
}

function fillWithAutoPool(partial, autoPool, minCredits, maxCredits, noDays, coursesDB) {
  const candidates = autoPool
    .map(code => coursesDB.find(c => c.code === code))
    .filter(Boolean)
    .sort((a,b) => b.credits - a.credits);
  const result = { enrolled:{...partial.enrolled}, credits:partial.credits, slots:[...partial.slots] };
  for (const course of candidates) {
    if (result.credits >= minCredits) break;
    if (result.credits + course.credits > maxCredits) continue;
    if (result.enrolled[course.code]) continue;
    for (const sec of course.sections) {
      if (sec.sched.some(s => noDays.includes(s.d))) continue;
      if (schedsConflict(sec.sched, result.slots)) continue;
      result.enrolled[course.code] = sec.no;
      result.credits += course.credits;
      result.slots = [...result.slots, ...sec.sched];
      break;
    }
  }
  return result;
}

function generateSchedules({ explicitPool, required, autoPool, noDays, minCredits, maxCredits, coursesDB, maxResults=10, excludeKeys=new Set() }) {
  const partialResults = [];
  const MAX_ITER = 100000;
  let iter = 0;
  const poolCourses = explicitPool.map(code => coursesDB.find(c => c.code === code)).filter(Boolean);

  function backtrack(idx, current, usedSlots, totalCredits) {
    if (iter++ > MAX_ITER || partialResults.length >= maxResults * 8) return;
    if (idx === poolCourses.length) {
      for (const req of required) if (!current[req]) return;
      if (totalCredits > maxCredits) return;
      partialResults.push({ enrolled:{...current}, credits:totalCredits, slots:[...usedSlots] });
      return;
    }
    const course = poolCourses[idx];
    const isReq = required.includes(course.code);
    for (const sec of course.sections) {
      if (sec.sched.some(s => noDays.includes(s.d))) continue;
      if (schedsConflict(sec.sched, usedSlots)) continue;
      if (totalCredits + course.credits > maxCredits) continue;
      current[course.code] = sec.no;
      backtrack(idx+1, current, [...usedSlots, ...sec.sched], totalCredits + course.credits);
      delete current[course.code];
      if (iter > MAX_ITER || partialResults.length >= maxResults * 8) return;
    }
    if (!isReq) backtrack(idx+1, current, usedSlots, totalCredits);
  }

  backtrack(0, {}, [], 0);

  const seen = new Set();
  return partialResults
    .map(p => autoPool.length > 0 && p.credits < minCredits
      ? fillWithAutoPool(p, autoPool, minCredits, maxCredits, noDays, coursesDB)
      : p
    )
    .filter(r => r.credits >= minCredits && r.credits <= maxCredits)
    .filter(r => { const k = JSON.stringify(Object.entries(r.enrolled).sort()); if(seen.has(k) || excludeKeys.has(k)) return false; seen.add(k); return true; })
    .map(r => ({...r, score: scoreResult(r, noDays, minCredits, maxCredits)}))
    .sort((a,b) => b.score - a.score)
    .slice(0, maxResults);
}

function MiniTimetable({ enrolledMap, coursesDB, dark }) {
  const palette = dark ? PALETTES.dark : PALETTES.light;
  const cellMap = {};
  Object.keys(enrolledMap).forEach((code, ci) => {
    const course = coursesDB.find(c => c.code === code);
    const sec = course?.sections.find(s => s.no === enrolledMap[code]);
    if (!sec) return;
    const col = palette[ci % palette.length];
    for (const seg of sec.sched)
      for (let p = seg.s; p <= seg.e; p++)
        cellMap[`${seg.d}-${p}`] = { col, title: course.title };
  });
  const ROWS = Array.from({length:12}, (_,i) => i+1);
  return (
    <div style={{flexShrink:0}}>
      <div style={{display:"grid",gridTemplateColumns:"16px repeat(5,1fr)",gap:1,marginBottom:2}}>
        <div/>
        {DAYS.map(d => <div key={d} style={{textAlign:"center",fontSize:8,fontWeight:700,color:"var(--text3)"}}>{d}</div>)}
      </div>
      {ROWS.map(p => (
        <div key={p} style={{display:"grid",gridTemplateColumns:"16px repeat(5,1fr)",gap:1,marginBottom:1}}>
          <div style={{fontSize:7,color:"var(--text3)",textAlign:"right",paddingRight:2,lineHeight:"13px"}}>{p}</div>
          {DAYS.map(d => {
            const cell = cellMap[`${d}-${p}`];
            return <div key={d} title={cell?.title} style={{height:13,borderRadius:2,
              background:cell?cell.col.bg:(dark?"#1a1a2e":"#f1f5f9"),
              border:cell?`1px solid ${cell.col.border}`:"none"}} />;
          })}
        </div>
      ))}
    </div>
  );
}

export default function RecommendModal({ coursesDB, enrolled, setEnrolled, onClose, darkMode, fs }) {
  const [step, setStep] = useState(1);
  const [noDays, setNoDays] = useState([]);
  const [minCredits, setMinCredits] = useState(15);
  const [maxCredits, setMaxCredits] = useState(21);
  const [myDept, setMyDept] = useState("");
  const [myGrade, setMyGrade] = useState(1);
  const [includeGeneral, setIncludeGeneral] = useState(true);
  const [poolSearch, setPoolSearch] = useState("");
  const [pool, setPool] = useState([]);
  const [required, setRequired] = useState([]);
  const [excluded, setExcluded] = useState(new Set()); // 배제 과목
  const [results, setResults] = useState([]);
  const [seenKeys, setSeenKeys] = useState(new Set()); // 이미 찾은 조합 키
  const [hasMore, setHasMore] = useState(false);       // 더 받기 가능 여부
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered = useMemo(() => {
    const q = poolSearch.trim().toLowerCase();
    if (!q) {
      const ec = new Set(Object.keys(enrolled));
      return [...coursesDB.filter(c => ec.has(c.code)), ...coursesDB.filter(c => !ec.has(c.code)).slice(0,50)];
    }
    return coursesDB.filter(c =>
      c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) ||
      c.sections.some(s => s.prof.includes(q))
    ).slice(0,80);
  }, [coursesDB, poolSearch, enrolled]);

  const autoPool = useMemo(() => {
    const explicitSet = new Set(pool);
    return coursesDB
      .filter(c => {
        if (explicitSet.has(c.code)) return false;
        if (excluded.has(c.code)) return false;         // 배제 과목 제외
        const gradeOk = c.grade === 0 || c.grade <= myGrade;
        const prefix = c.code.slice(0,3);
        if (myDept && prefix === myDept) return gradeOk;
        if (includeGeneral && prefix === "AAK") return gradeOk;
        return false;
      })
      .map(c => c.code);
  }, [coursesDB, pool, myDept, includeGeneral, myGrade, excluded]);

  const togglePool = (code) => {
    setPool(prev => {
      if (prev.includes(code)) { setRequired(r => r.filter(c => c !== code)); return prev.filter(c => c !== code); }
      return [...prev, code];
    });
  };
  const toggleRequired = (code) => {
    if (!pool.includes(code)) return;
    setRequired(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const buildAutoPool = (currentExcluded) => {
    const explicitSet = new Set(pool);
    return coursesDB.filter(c => {
      if (explicitSet.has(c.code) || (currentExcluded ?? excluded).has(c.code)) return false;
      const gradeOk = c.grade === 0 || c.grade <= myGrade;
      const prefix = c.code.slice(0,3);
      if (myDept && prefix === myDept) return gradeOk;
      if (includeGeneral && prefix === "AAK") return gradeOk;
      return false;
    }).map(c => c.code);
  };

  const runGenerate = useCallback((currentExcluded) => {
    setLoading(true);
    setTimeout(() => {
      try {
        const ap = buildAutoPool(currentExcluded);
        const res = generateSchedules({
          explicitPool: pool, required, autoPool: ap,
          noDays, minCredits, maxCredits, coursesDB, maxResults: 10,
          excludeKeys: new Set(),
        });
        const keys = new Set(res.map(r => JSON.stringify(Object.entries(r.enrolled).sort())));
        setSeenKeys(keys);
        setResults(res);
        setHasMore(res.length === 10); // 10개 꽉 찼으면 더 있을 수도 있음
      } catch(e) { console.error(e); setResults([]); setHasMore(false); }
      setLoading(false);
    }, 50);
  }, [pool, required, autoPool, noDays, minCredits, maxCredits, coursesDB, myDept, myGrade, includeGeneral, excluded]);

  const handleGenerate = () => { runGenerate(excluded); setStep(3); };

  // 더 받기
  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      try {
        const ap = buildAutoPool(excluded);
        const res = generateSchedules({
          explicitPool: pool, required, autoPool: ap,
          noDays, minCredits, maxCredits, coursesDB, maxResults: 10,
          excludeKeys: seenKeys,
        });
        if (res.length === 0) {
          setHasMore(false);
        } else {
          const newKeys = new Set([...seenKeys, ...res.map(r => JSON.stringify(Object.entries(r.enrolled).sort()))]);
          setSeenKeys(newKeys);
          setResults(prev => [...prev, ...res]);
          setHasMore(res.length === 10);
        }
      } catch(e) { console.error(e); setHasMore(false); }
      setLoadingMore(false);
    }, 50);
  }, [pool, required, autoPool, noDays, minCredits, maxCredits, coursesDB, myDept, myGrade, includeGeneral, excluded, seenKeys]);

  // 배제 시 자동 재계산
  const excludeCourse = (code) => {
    setExcluded(prev => {
      const next = new Set([...prev, code]);
      runGenerate(next);
      return next;
    });
  };

  const applyResult = (result) => { setEnrolled(result.enrolled); onClose(); };

  const btnPrimary = { padding:"9px 18px", border:"none", borderRadius:8, background:"#6366F1",
    color:"#fff", fontWeight:600, fontSize:fs.base, cursor:"pointer" };
  const btnSecondary = { padding:"9px 18px", border:"1.5px solid var(--border)", borderRadius:8,
    background:"var(--bg2)", color:"var(--text2)", fontWeight:500, fontSize:fs.base, cursor:"pointer" };
  const inputStyle = { padding:"8px 12px", borderRadius:8, border:"1.5px solid var(--border)",
    background:"var(--bg2)", color:"var(--text)", fontSize:fs.base, outline:"none",
    width:"100%", boxSizing:"border-box" };

  const stepLabels = ["조건 설정","과목 선택","추천 결과"];
  const getAchievedNoDays = (r) => noDays.filter(d => !r.slots.some(s => s.d === d));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      {/* ↑ onClick={onClose} 제거 — 바깥 클릭해도 안 닫힘 */}
      <div style={{background:"var(--bg)",borderRadius:16,width:"100%",maxWidth:580,
        maxHeight:"92vh",display:"flex",flexDirection:"column",
        boxShadow:"0 24px 64px rgba(0,0,0,.35)",overflow:"hidden"}}
        onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",
          display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontSize:fs.base+2,fontWeight:700,color:"var(--text)"}}>✨ 시간표 자동 추천</div>
            <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center"}}>
              {stepLabels.map((label,i) => {
                const n=i+1, active=step===n, done=step>n;
                return (
                  <div key={n} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:18,height:18,borderRadius:"50%",
                      background:done?"#6366F1":active?(darkMode?"#312E81":"#EEF2FF"):"var(--bg2)",
                      border:`2px solid ${done||active?"#6366F1":"var(--border)"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:9,fontWeight:700,color:done?"#fff":active?"#6366F1":"var(--text3)"}}>
                      {done?"✓":n}
                    </div>
                    <span style={{fontSize:fs.xs,color:active?"#6366F1":"var(--text3)",fontWeight:active?600:400}}>{label}</span>
                    {i<stepLabels.length-1 && <span style={{color:"var(--border)",fontSize:10,marginLeft:2}}>›</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={onClose} style={{border:"none",background:"none",fontSize:22,
            color:"var(--text3)",cursor:"pointer",lineHeight:1,padding:4}}>×</button>
        </div>

        {/* 바디 */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>

          {/* STEP 1 */}
          {step===1 && (
            <div style={{display:"flex",flexDirection:"column",gap:22}}>

              {/* 내 학과 */}
              <div>
                <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text2)",marginBottom:10}}>
                  🎓 내 학과 선택 <span style={{fontWeight:400,color:"var(--text3)"}}>(나머지 학점 자동 채움)</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {DEPT_OPTIONS.map(({prefix,label}) => {
                    const sel = myDept===prefix;
                    return (
                      <button key={prefix} onClick={() => setMyDept(sel?"":prefix)}
                        style={{padding:"5px 12px",borderRadius:99,border:"1.5px solid",
                          borderColor:sel?"#6366F1":"var(--border)",
                          background:sel?(darkMode?"#1e1b4b":"#EEF2FF"):"var(--bg2)",
                          color:sel?(darkMode?"#A5B4FC":"#6366F1"):"var(--text2)",
                          fontWeight:sel?700:400,fontSize:fs.sm,cursor:"pointer"}}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {myDept && (
                  <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
                    <label style={{display:"flex",alignItems:"center",gap:5,fontSize:fs.sm,color:"var(--text2)",cursor:"pointer"}}>
                      <input type="checkbox" checked={includeGeneral} onChange={e=>setIncludeGeneral(e.target.checked)} style={{accentColor:"#6366F1"}}/>
                      교양 과목도 자동 포함
                    </label>
                    <span style={{fontSize:fs.xs,color:"var(--text3)"}}>(자동 채움 {autoPool.length}과목)</span>
                  </div>
                )}
              </div>

              {/* 내 학년 */}
              <div>
                <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text2)",marginBottom:10}}>📅 내 학년</div>
                <div style={{display:"flex",gap:8}}>
                  {[1,2,3,4].map(g => {
                    const sel=myGrade===g;
                    return (
                      <button key={g} onClick={()=>setMyGrade(g)}
                        style={{flex:1,padding:"10px 0",borderRadius:10,border:"2px solid",
                          borderColor:sel?"#6366F1":"var(--border)",
                          background:sel?(darkMode?"#1e1b4b":"#EEF2FF"):"var(--bg2)",
                          color:sel?(darkMode?"#A5B4FC":"#6366F1"):"var(--text2)",
                          fontWeight:700,fontSize:fs.base,cursor:"pointer"}}>
                        {g}학년
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 공강일 */}
              <div>
                <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text2)",marginBottom:10}}>
                  🏖️ 공강일 <span style={{fontWeight:400,color:"var(--text3)"}}>(선택 안 해도 됨)</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {DAYS.map(d => {
                    const sel=noDays.includes(d);
                    return (
                      <button key={d} onClick={()=>setNoDays(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d])}
                        style={{flex:1,padding:"10px 0",borderRadius:10,border:"2px solid",
                          borderColor:sel?"#6366F1":"var(--border)",
                          background:sel?(darkMode?"#1e1b4b":"#EEF2FF"):"var(--bg2)",
                          color:sel?(darkMode?"#A5B4FC":"#6366F1"):"var(--text2)",
                          fontWeight:700,fontSize:fs.base,cursor:"pointer"}}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 학점 */}
              <div>
                <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text2)",marginBottom:10}}>📚 목표 학점 범위</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  {[["최소",minCredits,v=>setMinCredits(Math.max(1,Math.min(v,maxCredits)))],
                    ["최대",maxCredits,v=>setMaxCredits(Math.max(minCredits,Math.min(v,24)))]
                  ].map(([label,val,setter])=>(
                    <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontSize:fs.xs,color:"var(--text3)"}}>{label}</span>
                      <input type="number" min={1} max={24} value={val}
                        onChange={e=>setter(parseInt(e.target.value)||val)}
                        style={{...inputStyle,width:64,textAlign:"center",fontWeight:700,fontSize:fs.base+2}}/>
                    </div>
                  ))}
                  <span style={{fontSize:fs.sm,color:"var(--text3)",marginTop:14}}>학점</span>
                </div>
              </div>

              <div style={{padding:"12px 14px",background:darkMode?"#0f172a":"#F0FDF4",borderRadius:10,
                fontSize:fs.sm,color:darkMode?"#86EFAC":"#166534",lineHeight:1.7,
                border:`1px solid ${darkMode?"#166534":"#BBF7D0"}`}}>
                💡 직접 고른 과목으로 충돌 없는 조합을 만들고, 학점이 부족하면 내 학과·교양 과목으로 자동 채웁니다.
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:fs.sm,color:"var(--text3)"}}>
                반드시 듣고 싶은 과목을 선택하세요.{" "}
                <strong style={{color:darkMode?"#A5B4FC":"#6366F1"}}>🔒 필수</strong>로 지정하면 무조건 포함됩니다.
                {myDept && <span style={{color:darkMode?"#86EFAC":"#166534"}}> 나머지는 {DEPT_MAP[myDept]} 과목으로 자동 채워집니다.</span>}
              </div>

              {pool.length>0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 12px",
                  background:"var(--bg2)",borderRadius:10,border:"1px solid var(--border)",minHeight:40}}>
                  {pool.map(code=>{
                    const c=coursesDB.find(x=>x.code===code);
                    const isReq=required.includes(code);
                    if(!c) return null;
                    return (
                      <div key={code} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",
                        borderRadius:99,background:isReq?(darkMode?"#1e1b4b":"#EEF2FF"):"var(--bg)",
                        border:`1.5px solid ${isReq?"#6366F1":"var(--border)"}`,fontSize:fs.sm}}>
                        {isReq&&<span style={{fontSize:10}}>🔒</span>}
                        <span style={{color:"var(--text)",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</span>
                        <button onClick={()=>togglePool(code)} style={{border:"none",background:"none",cursor:"pointer",color:"var(--text3)",padding:0,lineHeight:1,fontSize:14}}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <input placeholder="과목명 / 교수명 / 코드 검색..." value={poolSearch}
                onChange={e=>setPoolSearch(e.target.value)} style={inputStyle} autoFocus/>

              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:300,overflowY:"auto"}}>
                {filtered.map(course=>{
                  const inPool=pool.includes(course.code);
                  const isReq=required.includes(course.code);
                  const isEnrolled=!!enrolled[course.code];
                  const gradeOver = course.grade > 0 && course.grade > myGrade;
                  return (
                    <div key={course.code}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"8px 12px",borderRadius:8,
                        background:inPool?(darkMode?"#1e1b4b":"#EEF2FF"):"var(--bg2)",
                        border:`1.5px solid ${inPool?"#6366F1":"var(--border)"}`,
                        cursor:"pointer",
                        opacity: gradeOver ? 0.4 : 1,
                      }}
                      onClick={()=>togglePool(course.code)}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:fs.sm,fontWeight:600,color:"var(--text)",display:"flex",alignItems:"center",gap:5}}>
                          {course.title}
                          {isEnrolled&&<span style={{fontSize:fs.xs,padding:"1px 5px",borderRadius:4,background:darkMode?"#052e16":"#DCFCE7",color:darkMode?"#86EFAC":"#166534"}}>수강중</span>}
                          {gradeOver&&<span style={{fontSize:fs.xs,padding:"1px 5px",borderRadius:4,background:darkMode?"#450a0a":"#FEE2E2",color:darkMode?"#FCA5A5":"#DC2626"}}>{course.grade}학년↑</span>}
                        </div>
                        <div style={{fontSize:fs.xs,color:"var(--text3)"}}>
                          {course.credits}학점 · {course.type} · {getDept(course.code)} · {course.sections.length}분반
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                        {inPool&&(
                          <button onClick={e=>{e.stopPropagation();toggleRequired(course.code);}}
                            style={{padding:"3px 8px",borderRadius:6,
                              border:`1.5px solid ${isReq?"#6366F1":"var(--border)"}`,
                              background:isReq?"#6366F1":"var(--bg)",color:isReq?"#fff":"var(--text3)",
                              fontSize:fs.xs,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                            {isReq?"🔒 필수":"필수"}
                          </button>
                        )}
                        <div style={{width:20,height:20,borderRadius:5,
                          border:`2px solid ${inPool?"#6366F1":"var(--border)"}`,
                          background:inPool?"#6366F1":"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          color:"#fff",fontSize:12,fontWeight:700}}>
                          {inPool?"✓":""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length===0&&<div style={{textAlign:"center",color:"var(--text3)",fontSize:fs.sm,padding:24}}>검색 결과 없음</div>}
              </div>
              <div style={{fontSize:fs.sm,color:"var(--text3)",textAlign:"right"}}>
                직접 선택 {pool.length}과목{required.length>0&&` · 필수 ${required.length}개`}{myDept&&` · 자동 채움 ${autoPool.length}과목 대기`}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {loading ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"var(--text3)",fontSize:fs.base}}>
                  ⏳ 재계산 중...
                </div>
              ) : results.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                  <div style={{fontSize:40}}>😔</div>
                  <div style={{fontSize:fs.base+1,fontWeight:700,color:"var(--text)"}}>조건에 맞는 시간표가 없습니다</div>
                  <div style={{fontSize:fs.sm,color:"var(--text3)",lineHeight:1.7}}>
                    · 필수 과목들 간 시간 충돌이 있을 수 있어요<br/>
                    · 공강일을 줄이거나 없애보세요<br/>
                    · 학점 범위를 넓혀보세요 (예: 12~24)<br/>
                    · 학과를 선택하면 나머지 학점을 자동으로 채워줘요
                  </div>
                </div>
              ) : (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:fs.sm,color:"var(--text3)"}}>{results.length}개 시간표 — 클릭하면 적용</span>
                    {excluded.size>0&&(
                      <button onClick={()=>{ setExcluded(new Set()); runGenerate(new Set()); }}
                        style={{fontSize:fs.xs,padding:"3px 8px",borderRadius:6,border:"1px solid var(--border)",
                          background:"var(--bg2)",color:"var(--text3)",cursor:"pointer"}}>
                        배제 초기화 ({excluded.size})
                      </button>
                    )}
                  </div>
                  {results.map((r,i)=>{
                    const achieved=getAchievedNoDays(r);
                    const courseList=Object.keys(r.enrolled).map(code=>{
                      const c=coursesDB.find(x=>x.code===code);
                      const sec=c?.sections.find(s=>s.no===r.enrolled[code]);
                      const isAuto=!pool.includes(code);
                      return {code, title:c?.title||code, sec, isAuto};
                    });
                    return (
                      <div key={i} onClick={()=>applyResult(r)}
                        style={{padding:"14px",borderRadius:12,
                          border:`2px solid ${i===0?"#6366F1":"var(--border)"}`,
                          background:i===0?(darkMode?"#0f0e22":"#F5F3FF"):"var(--bg2)",
                          cursor:"pointer",transition:"transform .1s,box-shadow .1s"}}
                        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(99,102,241,.2)";}}
                        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            {i===0&&<span style={{fontSize:fs.xs,fontWeight:700,color:"#6366F1"}}>⭐ BEST</span>}
                            <span style={{fontWeight:700,color:"var(--text)",fontSize:fs.sm}}>추천 {i+1}</span>
                            <span style={{padding:"2px 8px",borderRadius:99,background:darkMode?"#1e1b4b":"#EEF2FF",color:darkMode?"#A5B4FC":"#6366F1",fontSize:fs.xs,fontWeight:700}}>{r.credits}학점</span>
                            {achieved.map(d=>(
                              <span key={d} style={{padding:"2px 7px",borderRadius:99,background:darkMode?"#052e16":"#DCFCE7",color:darkMode?"#86EFAC":"#166534",fontSize:fs.xs,fontWeight:700}}>{d} 공강 ✓</span>
                            ))}
                          </div>
                          <span style={{fontSize:fs.xs,color:"var(--text3)",flexShrink:0}}>클릭해서 적용 →</span>
                        </div>
                        <div style={{display:"flex",gap:14}}>
                          <MiniTimetable enrolledMap={r.enrolled} coursesDB={coursesDB} dark={darkMode}/>
                          <div style={{flex:1,display:"flex",flexDirection:"column",gap:5,justifyContent:"center",minWidth:0}}>
                            {courseList.map(({code,title,sec,isAuto})=>(
                              <div key={code} style={{fontSize:fs.xs,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:4}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                                    <span style={{fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</span>
                                    {isAuto&&(
                                      <span style={{fontSize:fs.xs-1,padding:"1px 4px",borderRadius:3,
                                        background:darkMode?"#082f49":"#E0F2FE",color:darkMode?"#7DD3FC":"#0284C7",flexShrink:0}}>
                                        자동
                                      </span>
                                    )}
                                  </div>
                                  {sec&&<div style={{color:"var(--text3)"}}>{sec.prof} · {sec.sched.map(s=>`${s.d}${s.s===s.e?s.s:`${s.s}~${s.e}`}교시`).join(", ")}</div>}
                                </div>
                                {isAuto&&(
                                  <button
                                    onClick={e=>{e.stopPropagation(); excludeCourse(code);}}
                                    title="이 과목 배제하고 재추천"
                                    style={{flexShrink:0,padding:"2px 6px",borderRadius:5,border:"1px solid",
                                      borderColor:darkMode?"#991B1B":"#FCA5A5",
                                      background:darkMode?"#450a0a":"#FEE2E2",
                                      color:darkMode?"#FCA5A5":"#DC2626",
                                      fontSize:fs.xs-1,cursor:"pointer",whiteSpace:"nowrap"}}>
                                    ✕ 배제
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      style={{width:"100%",padding:"11px 0",borderRadius:10,
                        border:"1.5px solid var(--border)",background:"var(--bg2)",
                        color:"var(--text2)",fontWeight:600,fontSize:fs.sm,cursor:"pointer",
                        opacity:loadingMore?0.6:1}}
                    >
                      {loadingMore ? "⏳ 탐색 중..." : "추천 더 받기 ↓"}
                    </button>
                  )}
                  {!hasMore && results.length > 0 && (
                    <div style={{textAlign:"center",fontSize:fs.xs,color:"var(--text3)",padding:"8px 0"}}>
                      더 이상 조건에 맞는 시간표가 없습니다
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{padding:"12px 20px",borderTop:"1px solid var(--border)",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,gap:8}}>
          <div>{step>1&&<button onClick={()=>setStep(s=>s-1)} style={btnSecondary}>← 이전</button>}</div>
          <div style={{display:"flex",gap:8}}>
            {step===1&&<button onClick={()=>setStep(2)} style={btnPrimary}>과목 선택 →</button>}
            {step===2&&(
              <button onClick={handleGenerate}
                disabled={(pool.length===0&&autoPool.length===0)||loading}
                style={{...btnPrimary,opacity:(pool.length===0&&autoPool.length===0)?0.45:1,minWidth:140}}>
                {loading?"⏳ 탐색 중...":"✨ 추천받기"}
              </button>
            )}
            {step===3&&<button onClick={()=>setStep(2)} style={btnPrimary}>조건 재설정</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export { schedsConflict, generateSchedules, fillWithAutoPool, scoreResult };