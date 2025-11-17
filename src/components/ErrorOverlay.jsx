// src/components/ErrorOverlay.jsx
import React from "react";

export default function ErrorOverlay({ title = "오류", message = "", stack = "" }) {
  return (
    <div style={{
      maxWidth: 1000, margin: "24px auto", padding: 16, borderRadius: 12,
      border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b",
      fontFamily: "ui-sans-serif, system-ui",
    }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>⚠️ {title}</div>
      {message && (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, margin: 0 }}>
          {String(message).slice(0, 2000)}
        </pre>
      )}
      {stack && (
        <>
          <div style={{ marginTop: 8, fontWeight: 700 }}>Stack</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#7f1d1d", margin: 0 }}>
            {String(stack).slice(0, 4000)}
          </pre>
        </>
      )}
      <button
        onClick={() => location.reload()}
        style={{ marginTop: 10, padding: "6px 10px", borderRadius: 8, background: "#991b1b", color: "#fff" }}
      >
        새로고침
      </button>
    </div>
  );
}
