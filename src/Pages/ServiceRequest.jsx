// src/Pages/ServiceRequest.jsx
import { useEffect, useState } from "react";
import { listMyTickets } from "../integrations/Core";
import { useI18n } from "../i18n/I18nProvider";

export default function MyRequests() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      try { setTickets(await listMyTickets()); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-slate-600">Loading…</div>;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-[15px] font-semibold text-slate-900 mb-4">{t("head_my")}</div>
        {tickets.length === 0 ? (
          <div className="text-sm text-slate-500">{t("no_requests")}</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="th w-16">{t("th_id")}</th>
                <th className="th">{t("th_customer")}</th>
                <th className="th">{t("th_equipment")}</th>
                <th className="th w-36">{t("th_status")}</th>
                <th className="th w-48">{t("th_created")}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((tkt) => (
                <tr key={tkt.id}>
                  <td className="td">#{tkt.ticket_number}</td>
                  <td className="td">
                    <div className="font-medium">{tkt.customer_name || "-"}</div>
                    <div className="text-xs text-slate-500">{tkt.country || "N/A"}</div>
                  </td>
                  <td className="td">
                    <div className="font-medium">{tkt.attachment_model || "-"}</div>
                    <div className="text-xs text-slate-500">{tkt.attachment_type || "-"}</div>
                  </td>
                  <td className="td">{statusText(tkt.status, t)}</td>
                  <td className="td">{new Date(tkt.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function statusText(s, t) {
  if (s === "received") return t("st_received");
  if (s === "in_progress") return t("st_in_progress");
  if (s === "completed") return t("st_completed");
  if (s === "on_hold") return t("st_on_hold");
  if (s === "cancelled") return t("st_cancelled");
  return s || "-";
}
