// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("💥 Render error:", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;

    const msg = (this.state.error?.message || String(this.state.error)).slice(0, 500);
    const stack = (this.state.error?.stack || "").slice(0, 1500);

    return (
      <div style={{
        padding: 16, margin: 16, borderRadius: 12,
        background: "#fff1f2", color: "#991b1b",
        border: "1px solid #fecaca", fontFamily: "ui-sans-serif, system-ui"
      }}>
        <div style={{fontWeight:700, marginBottom:8}}>⚠️ 화면 렌더링 중 오류가 발생했어요.</div>
        <div style={{whiteSpace:"pre-wrap", fontSize:13}}>{msg}</div>
        {stack && (
          <>
            <div style={{marginTop:8, fontWeight:600}}>Stack</div>
            <pre style={{whiteSpace:"pre-wrap", fontSize:12, color:"#7f1d1d"}}>{stack}</pre>
          </>
        )}
        <button
          onClick={() => location.reload()}
          style={{marginTop:8, padding:"6px 10px", borderRadius:8, background:"#991b1b", color:"#fff"}}
        >
          새로고침
        </button>
      </div>
    );
  }
}
