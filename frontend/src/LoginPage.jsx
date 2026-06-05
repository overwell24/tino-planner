// frontend/src/LoginPage.jsx
import { useState } from "react";
import { login, syncAll, getAllCourses, transformSyncData } from "./api";

export default function LoginPage({ onLoginSuccess, onClose, mode = "page", darkMode = false }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const isModal = mode === "modal";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId || !password) {
      setError("학번과 비밀번호를 입력하세요.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      setProgress("로그인 중...");
      await login(userId, password);

      setProgress("수강 과목과 과제를 수집하는 중... (최대 30초)");
      const [syncRes, allCourses] = await Promise.all([
        syncAll(userId),
        getAllCourses().catch(() => []),  // 실패해도 로그인은 진행
      ]);

      const { coursesDB, enrolled, events } = transformSyncData(syncRes, allCourses);

      onLoginSuccess({ userId, coursesDB, enrolled, events });
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다.");
      setLoading(false);
      setProgress("");
    }
  }

  async function handleGuest() {
    setError("");
    setLoading(true);
    try {
      setProgress("강의 데이터를 불러오는 중...");
      const allCourses = await getAllCourses().catch(() => []);
      onLoginSuccess({
        userId: null,         // 비로그인이라 백엔드 호출 차단용
        coursesDB: allCourses, // 전체 488개 다 보여주기 (수업시간표 모달에서 직접 추가)
        enrolled: {},          // 수강 없음
        events: [],            // 일정 없음
      });
    } catch (err) {
      setError(err.message || "데이터를 불러오지 못했습니다.");
      setLoading(false);
      setProgress("");
    }
  }

  const bg = darkMode ? "#202124" : "#F8FAFC";
  const cardBg = darkMode ? "#292A2D" : "#ffffff";
  const text = darkMode ? "#E8EAED" : "#1E293B";
  const text2 = darkMode ? "#BDC1C6" : "#64748B";
  const text3 = darkMode ? "#9AA0A6" : "#94A3B8";
  const border = darkMode ? "#3C4043" : "#E2E8F0";
  const inputBg = darkMode ? "#1A1B1E" : "#ffffff";

  return (
    <div
      onClick={isModal && onClose ? onClose : undefined}
      style={{
        position: isModal ? "fixed" : "static",
        inset: isModal ? 0 : undefined,
        minHeight: "100vh",
        background: isModal ? "rgba(0,0,0,.45)" : bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Noto Sans KR', sans-serif",
        zIndex: isModal ? 1000 : undefined,
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          background: cardBg,
          border: `0.5px solid ${border}`,
          borderRadius: 20,
          padding: "36px 28px",
          boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,.4)" : "0 4px 20px rgba(0,0,0,.06)",
      }}>
        {/* 닫기 버튼 (모달 모드일 때만) */}
        {isModal && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              border: "none",
              background: "none",
              fontSize: 22,
              color: text3,
              cursor: "pointer",
              lineHeight: 1,
              padding: 4,
            }}
            aria-label="닫기"
          >×</button>
        )}
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#6366F1" }}>Tino</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: text }}>Plan</span>
          </div>
          <div style={{ fontSize: 12, color: text3, marginTop: 6 }}>한국공학대 학사 캘린더</div>
        </div>

        {/* 안내 */}
        <div style={{
          background: darkMode ? "#1A2436" : "#EFF6FF",
          border: `1px solid ${darkMode ? "#2C384F" : "#DBEAFE"}`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 20,
          fontSize: 12,
          color: darkMode ? "#93C5FD" : "#1D4ED8",
          lineHeight: 1.5,
        }}>
          E-class 계정으로 로그인하면 시간표와 과제가 자동으로 캘린더에 반영됩니다.
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: text2, marginBottom: 6 }}>
              학번
            </label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="학번 입력"
              disabled={loading}
              autoComplete="username"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `0.5px solid ${border}`,
                borderRadius: 10,
                fontSize: 14,
                background: inputBg,
                color: text,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: text2, marginBottom: 6 }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              disabled={loading}
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `0.5px solid ${border}`,
                borderRadius: 10,
                fontSize: 14,
                background: inputBg,
                color: text,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: darkMode ? "#412A36" : "#FEF2F2",
              border: `1px solid ${darkMode ? "#7F1D1D" : "#FECACA"}`,
              color: darkMode ? "#FCA5A5" : "#991B1B",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
            }}>
              {error}
            </div>
          )}

          {loading && progress && (
            <div style={{
              background: darkMode ? "#1F3A2E" : "#ECFDF5",
              border: `1px solid ${darkMode ? "#166534" : "#A7F3D0"}`,
              color: darkMode ? "#86EFAC" : "#065F46",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span className="spinner" style={{
                width: 12, height: 12, borderRadius: "50%",
                border: `2px solid ${darkMode ? "#86EFAC" : "#065F46"}`,
                borderTopColor: "transparent",
                display: "inline-block",
              }}></span>
              {progress}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              background: loading ? "#9CA3AF" : "#6366F1",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "처리 중..." : "로그인"}
          </button>

          {/* 둘러보기 — 페이지 모드일 때만 */}
          {!isModal && (
            <>
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0",color:text3,fontSize:11}}>
                <div style={{flex:1,height:1,background:border}}></div>
                <span>또는</span>
                <div style={{flex:1,height:1,background:border}}></div>
              </div>

              <button
                type="button"
                onClick={handleGuest}
                disabled={loading}
                style={{
                  padding: "12px 0",
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  background: "transparent",
                  color: text2,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                로그인 없이 둘러보기
              </button>
            </>
          )}
        </form>

        <div style={{ fontSize: 11, color: text3, textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          입력한 자격증명은 서버에 저장되지 않으며,<br />
          E-class 크롤링에만 사용됩니다.
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin .8s linear infinite; }
      `}</style>
    </div>
  );
}