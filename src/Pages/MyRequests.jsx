// src/Pages/MyRequests.jsx
import { useEffect, useState } from "react";
import { listMyTickets } from "../integrations/Core";

export default function MyRequests() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listMyTickets();
        setTickets(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-sm text-slate-600">Loading…</div>;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-[15px] font-semibold text-slate-900 mb-4">My Requests</div>
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
                  <td className="td"><span className="badge">{prettyStatus(t.status)}</span></td>
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
