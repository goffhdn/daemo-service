// src/Pages/ServiceDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { listAllTickets, setTicketStatus } from "../integrations/Core";
import Confirm from "../components/Confirm";
import { useI18n } from "../i18n/I18nProvider";

export default function ServiceDashboard() {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setErr(""); setLoading(true);
    try { setRows(await listAllTickets()); }
    catch (e) { setErr(e.message || "Error"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const stat = useMemo(() => {
    const total = rows.length;
    const rec = rows.filter((r) => r.status === "received").length;
    const prog = rows.filter((r) => r.status === "in_progress").length;
    const done = rows.filter((r) => r.status === "completed").length;
    const hold = rows.filter((r) => r.status === "on_hold").length;
    const cancel = rows.filter((r) => r.status === "cancelled").length;
    const completion = total ? Math.round((done / (total - cancel || 1)) * 100) : 0;
    return { total, rec, prog, done, hold, cancel, completion };
  }, [rows]);

  const changeStatus = async (id, next) => {
    setConfirm(null);
    try { await setTicketStatus(id, next); await load(); }
    catch (e) { alert(e.message || "failed"); }
  };

  return (
    <div className="grid gap-6">
      {err && <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 p-4">{err}</div>}

      <div className="grid gap-4 md:grid-cols-5">
        <Kpi title={t("kpi_total")} value={stat.total} />
        <Kpi title={t("kpi_received")} value={stat.rec} />
        <Kpi title={t("kpi_in_progress")} value={stat.prog} />
        <Kpi title={t("kpi_on_hold")} value={stat.hold} />
        <Kpi title={t("kpi_completed")} value={stat.done} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-[15px] font-semibold text-slate-900 mb-3">{t("completion_rate")}</div>
        <div className="h-3 rounded-xl bg-slate-100 overflow-hidden">
          <div className="h-full bg-slate-900" style={{ width: `${Math.min(100, Math.max(0, stat.completion))}%` }} />
        </div>
        <div className="text-right text-slate-600 text-sm mt-1">{stat.completion}%</div>
        <div className="text-xs text-slate-500 mt-2">{t("completion_desc")}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-semibold text-slate-900">{t("all_requests")}</div>
          <button className="btn btn-ghost" onClick={load}>{t("refresh")}</button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-600">Loading…</div>
        ) : rows.length === 0 ? (
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
                <th className="th w-48">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="td">#{r.ticket_number}</td>
                  <td className="td">
                    <div className="font-medium">{r.customer_name || "-"}</div>
                    <div className="text-xs text-slate-500">{r.country || "N/A"}</div>
                  </td>
                  <td className="td">
                    <div className="font-medium">{r.attachment_model || "-"}</div>
                    <div className="text-xs text-slate-500">{r.attachment_type || "-"}</div>
                  </td>
                  <td className="td"><StatusBadge t={t} s={r.status} /></td>
                  <td className="td">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      {nextActions(r.status).map((n) => (
                        <button key={n} className="btn btn-ghost" onClick={() => setConfirm({ id: r.id, next: n })}>
                          {t("set")} {pretty(t, n)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirm && (
        <Confirm
          title={t("confirm_title")}
          message={t("confirm_msg", { status: pretty(t, confirm.next) })}
          onCancel={() => setConfirm(null)}
          onConfirm={() => changeStatus(confirm.id, confirm.next)}
        />
      )}
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function StatusBadge({ s, t }) {
  const cls =
    s === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    s === "in_progress" ? "bg-amber-100 text-amber-700 border-amber-200" :
    s === "on_hold" ? "bg-orange-100 text-orange-700 border-orange-200" :
    s === "cancelled" ? "bg-rose-100 text-rose-700 border-rose-200" :
    "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`badge ${cls}`}>{pretty(t, s)}</span>;
}

function pretty(t, s) {
  if (s === "received") return t("st_received");
  if (s === "in_progress") return t("st_in_progress");
  if (s === "completed") return t("st_completed");
  if (s === "on_hold") return t("st_on_hold");
  if (s === "cancelled") return t("st_cancelled");
  return s;
}
function nextActions(s) {
  if (s === "received") return ["in_progress", "cancelled"];
  if (s === "in_progress") return ["completed", "on_hold", "cancelled"];
  if (s === "on_hold") return ["in_progress", "cancelled"];
  if (s === "completed") return ["on_hold"];
  if (s === "cancelled") return ["received"];
  return ["received"];
}
