// src/components/Confirm.jsx
import React from "react";

export default function Confirm({ title="확인", message="", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="card-soft max-w-md w-full" onClick={(e)=>e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 font-semibold">{title}</div>
        <div className="p-5 text-sm text-slate-700 whitespace-pre-wrap">{message}</div>
        <div className="p-4 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel}>취소</button>
          <button className="btn btn-primary" onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
}
