// src/Pages/ServiceRequest.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/Toast";
import { useI18n } from "../i18n/I18nProvider";
import { createTicket, getNextTicketNumber, uploadAttachment } from "../integrations/Core";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB per file

const INITIAL_FORM = {
  country: "",
  customer_name: "",
  contact: "",
  attachment_type: "",
  attachment_model: "",
  attachment_serial: "",
  installed_at: "",
  failed_at: "",
  symptom: "",
};

export default function ServiceRequest() {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();

  const [ticketNumber, setTicketNumber] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]); // File[]
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getNextTicketNumber().then(setTicketNumber).catch(() => setTicketNumber(null));
  }, []);

  const requiredLeft = useMemo(() => {
    return ["customer_name", "contact", "attachment_type", "attachment_model", "symptom"]
      .filter((k) => !form[k]?.trim()).length;
  }, [form]);

  const onChange = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const onFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    const accepted = [];
    let rejected = false;
    picked.forEach((f) => {
      if (f.size > MAX_FILE_SIZE) {
        rejected = true;
        return;
      }
      accepted.push(f);
    });

    if (rejected) toast.push(t("some_files_rejected"), "error");
    if (accepted.length > 0) setFiles((s) => [...s, ...accepted]);
    e.target.value = "";
  };

  const removeFile = (name) => setFiles((s) => s.filter((f) => f.name !== name));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.push(t("please_sign_in"), "error");
      return;
    }
    if (requiredLeft > 0) {
      toast.push(t("please_fill_required"), "error");
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = [];
      for (const f of files) {
        const url = await uploadAttachment(f);
        uploaded.push(url);
      }

      await createTicket({
        ticket_number: ticketNumber,
        country: form.country.trim() || null,
        customer_name: form.customer_name.trim(),
        contact: form.contact.trim(),
        attachment_type: form.attachment_type.trim(),
        attachment_model: form.attachment_model.trim(),
        attachment_serial: form.attachment_serial.trim() || null,
        installed_at: form.installed_at || null,
        failed_at: form.failed_at || null,
        symptom: form.symptom.trim(),
        attachments: uploaded,
        status: "received",
        created_by: user.email,
      });

      toast.push(t("submitted_ok"), "success");
      setForm(INITIAL_FORM);
      setFiles([]);
      setTicketNumber(await getNextTicketNumber());
    } catch (err) {
      toast.push(err.message || "Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[15px] font-semibold text-slate-900">{t("head_request")}</div>
              <div className="text-xs text-slate-500">{t("head_sub_request")}</div>
            </div>
            <div className="text-xs text-slate-500">
              {t("required_left")}: <span className="font-semibold text-slate-900">{requiredLeft}</span>
            </div>
          </div>

          {!user && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 p-3 text-sm">
              {t("info_need_signin")}
            </div>
          )}

          <div className="grid gap-6 mt-6">
            <Section title={t("customer_info")}>
              <Field label={t("country")}> <input className="input" value={form.country} onChange={onChange("country")} /> </Field>
              <Field label={t("name_company_required")} required>
                <input className="input" value={form.customer_name} onChange={onChange("customer_name")} />
              </Field>
              <Field label={t("contact_required")} required>
                <input className="input" value={form.contact} onChange={onChange("contact")} />
              </Field>
            </Section>

            <Section title={t("attach_info")}>
              <Field label={t("attach_type_required")} required>
                <input className="input" value={form.attachment_type} onChange={onChange("attachment_type")} />
              </Field>
              <Field label={t("model_required")} required>
                <input className="input" value={form.attachment_model} onChange={onChange("attachment_model")} />
              </Field>
              <Field label={t("serial_no")}>
                <input className="input" value={form.attachment_serial} onChange={onChange("attachment_serial")} />
              </Field>
            </Section>

            <Section title={t("failure_details")}>
              <Field label={t("installed_at")}>
                <input type="date" className="input" value={form.installed_at} onChange={onChange("installed_at")} />
              </Field>
              <Field label={t("failed_at")}>
                <input type="date" className="input" value={form.failed_at} onChange={onChange("failed_at")} />
              </Field>
              <Field label={t("symptom_required")} required>
                <textarea
                  className="input min-h-[120px]"
                  value={form.symptom}
                  onChange={onChange("symptom")}
                  placeholder=""
                />
              </Field>
            </Section>

            <Section title={t("attachments_title")}>
              <div className="text-xs text-slate-500 mb-3">{t("per_file_limit")}: 15MB</div>
              <input
                type="file"
                accept="image/*,application/pdf,video/mp4"
                multiple
                onChange={onFiles}
                className="block text-sm text-slate-700"
              />
              {files.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <span className="truncate">{f.name}</span>
                      <button type="button" className="btn btn-ghost text-xs" onClick={() => removeFile(f.name)}>
                        {t("removed")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {ticketNumber ? `#${ticketNumber}` : "#----"}
              {user && <span className="ml-2 text-xs">{t("info_signed_in_as")}: {user.email}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-[13px] font-semibold text-slate-900 mb-3">{title}</div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <div className="label flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </div>
      {children}
    </label>
  );
}
