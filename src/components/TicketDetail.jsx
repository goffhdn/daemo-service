import { useEffect, useState } from "react";
import { getTicketById } from "../integrations/Core";

export default function TicketDetail({ id, onClose }) {
  const [t, setT] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getTicketById(id);
        setT(data);
      } catch (e) {
        setErr(e.message || "불러오기 오류");
      }
    })();
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-soft max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold">Ticket Detail {t ? `#${t.ticket_number}` : ""}</div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
        <div className="p-5">
          {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
          {!t ? (
            <div className="text-sm text-slate-600">Loading...</div>
          ) : (
            <div className="grid gap-6">
              <Section title="Basic">
                <Row k="Status" v={<StatusPill status={t.status} />} />
                <Row k="Created At" v={new Date(t.created_at).toLocaleString()} />
                <Row k="Customer" v={t.customer_name || "-"} />
                <Row k="Country" v={t.country || "-"} />
                <Row k="Contact" v={t.contact || "-"} />
              </Section>
              <Section title="Attachment">
                <Row k="Type" v={t.attachment_type || "-"} />
                <Row k="Model" v={t.attachment_model || "-"} />
                <Row k="Serial No." v={t.attachment_serial || "-"} />
              </Section>
              <Section title="Failure">
                <Row k="Installed At" v={t.installed_at || "-"} />
                <Row k="Failed At" v={t.failed_at || "-"} />
                <Row k="Symptom" v={<pre className="whitespace-pre-wrap text-slate-700 text-sm">{t.symptom || "-"}</pre>} />
              </Section>
              <Section title="Files">
                {Array.isArray(t.attachments) && t.attachments.length > 0 ? (
                  <ul className="grid gap-2">
                    {t.attachments.map((url, i) => (
                      <li key={i} className="flex items-center justify-between p-2 border border-slate-200 rounded-xl">
                        <span className="truncate text-sm">{fileName(url)}</span>
                        <a className="btn btn-ghost text-sm" href={url} target="_blank" rel="noreferrer">Open</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-600">No files</div>
                )}
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Section({ title, children }) { return (<div className="rounded-xl border border-slate-200 p-4"><div className="text-[13px] font-semibold text-slate-900 mb-3">{title}</div><div className="grid gap-2">{children}</div></div>); }
function Row({ k, v }) { return (<div className="flex items-start gap-3 text-sm"><div className="w-36 text-slate-500">{k}</div><div className="flex-1">{v}</div></div>); }
function fileName(url){try{return decodeURIComponent(url.split("/").pop()||url);}catch{return url;}}
function StatusPill({ status }){const cls=status==="completed"?"badge-success":status==="in_progress"?"badge-info":status==="on_hold"?"badge-warn":"";return <span className={`badge ${cls}`}>{(status||"-").replace("_"," ")}</span>;}
