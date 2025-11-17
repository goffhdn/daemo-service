// src/components/Toast.jsx
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [list, setList] = useState([]); // { id, msg, kind }

  const push = useCallback((msg, kind = "info", ms = 2400) => {
    const id = Math.random().toString(36).slice(2);
    setList((s) => [...s, { id, msg, kind }]);
    setTimeout(() => setList((s) => s.filter((t) => t.id !== id)), ms);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed z-50 bottom-4 right-4 grid gap-2">
        {list.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-3 py-2 text-sm shadow-sm bg-white ${
              t.kind === "error"
                ? "border-rose-200 text-rose-700"
                : t.kind === "success"
                ? "border-emerald-200 text-emerald-700"
                : "border-slate-200 text-slate-700"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
