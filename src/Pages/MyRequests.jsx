// src/Pages/MyRequests.jsx
import { useEffect, useState } from "react";
import { listMyTickets } from "../integrations/Core";

export default function MyRequests() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const rows = await listMyTickets();
      setTickets(rows);
    } catch (e) {
      setError(e.message || "요청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="text-sm text-slate-600">Loading…</div>;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-[15px] font-semibold text-slate-900 mb-4">My Requests</div>
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm flex items-center justify-between gap-3">
            <span className="truncate">{error}</span>
            <button className="btn btn-ghost text-xs" onClick={load}>
              재시도
            </button>
          </div>
        )}
        {tickets.length === 0 ? (
          <div className="text-sm text-slate-500">접수된 요청이 없습니다.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="th w-16">ID</th>
                <th className="th">Customer</th>
                <th className="th">Equipment</th>
                <th className="th w-36">Status</th>
                <th className="th w-48">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="td">#{t.ticket_number}</td>
                  <td className="td">
                    <div className="font-medium">{t.customer_name || "-"}</div>
                    <div className="text-xs text-slate-500">{t.country || "N/A"}</div>
                  </td>
                  <td className="td">
                    <div className="font-medium">{t.attachment_model || "-"}</div>
                    <div className="text-xs text-slate-500">{t.attachment_type || "-"}</div>
                  </td>
                  <td className="td"><span className={`badge ${statusColor(t.status)}`}>{prettyStatus(t.status)}</span></td>
                  <td className="td">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function prettyStatus(s) {
  if (s === "received") return "Received";
  if (s === "in_progress") return "In Progress";
  if (s === "completed") return "Completed";
  if (s === "on_hold") return "On Hold";
  if (s === "cancelled") return "Cancelled";
  return s || "-";
}

function statusColor(s) {
  if (s === "completed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "in_progress") return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "on_hold") return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === "cancelled") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}
