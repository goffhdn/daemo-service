// src/Pages/ServiceRequest.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/Toast";
import { useI18n } from "../i18n/I18nProvider";
import { createTicket, getNextTicketNumber, uploadAttachment } from "../integrations/Core";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB per file
const MAX_FILES = 12;

const INITIAL_FORM = {
  country: "",
  customer_name: "",
  contact: "",
  dealer: "",
  email: "",
  machine_model: "",
  machine_serial: "",
  machine_hours: "",
  attachment_type: "",
  attachment_model: "",
  attachment_serial: "",
  attachment_hours: "",
  installed_at: "",
  failed_at: "",
  symptom: "",
  symptom_notes: "",
  operating_pressure: "",
  flow_rate: "",
  oil_temperature: "",
  environment: "",
  carrier_size: "",
  issue_started_at: "",
  previous_repairs: "",
  usage_history: "",
};

export default function ServiceRequest() {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();

  const [ticketNumber, setTicketNumber] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]); // File[]
  const [errors, setErrors] = useState({});
  const inputRefs = useRef({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    getNextTicketNumber().then(setTicketNumber).catch(() => setTicketNumber(null));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    setForm((prev) => {
      if (prev.email?.trim()) return prev;
      return { ...prev, email: user.email };
    });
  }, [user]);

  const requiredKeys = useMemo(
    () => ["customer_name", "contact", "attachment_type", "attachment_model", "attachment_serial", "symptom"],
    []
  );

  const requiredLeft = useMemo(() => {
    return requiredKeys.filter((k) => !form[k]?.trim()).length;
  }, [form, requiredKeys]);

  const invalidEmail = form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const attachmentsOverLimit = files.length > MAX_FILES;

  useEffect(() => {
    setErrors((prev) => {
      if (!prev.email && !invalidEmail) return prev;
      if (invalidEmail) return { ...prev, email: "Please enter a valid email address." };
      const next = { ...prev };
      delete next.email;
      return next;
    });
  }, [invalidEmail]);

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((s) => ({ ...s, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const scrollToFirstError = (errs) => {
    const firstKey = Object.keys(errs)[0];
    if (!firstKey) return;
    const node = inputRefs.current[firstKey];
    if (node?.scrollIntoView) {
      requestAnimationFrame(() => node.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    if (node?.focus) node.focus();
  };

  const validate = () => {
    const required = {
      customer_name: "Customer / company name is required.",
      contact: "Contact information is required.",
      attachment_type: "Attachment type is required.",
      attachment_model: "Breaker model is required.",
      attachment_serial: "Breaker serial number is required.",
      symptom: "Please describe the main symptom.",
    };
    const next = {};
    Object.entries(required).forEach(([key, message]) => {
      if (!form[key]?.trim()) next[key] = message;
    });

    if (invalidEmail) {
      next.email = "Please enter a valid email address.";
    }

    if (attachmentsOverLimit) {
      next.attachments = `Please limit attachments to ${MAX_FILES} files.`;
    }

    return next;
  };

  const onFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    const accepted = [];
    let rejected = false;
    const existingKey = (file) => `${file.name}-${file.size}`;
    const existing = new Set(files.map(existingKey));

    picked.forEach((f) => {
      if (f.size > MAX_FILE_SIZE) {
        rejected = true;
        return;
      }
      const key = existingKey(f);
      if (existing.has(key)) {
        rejected = true;
        return;
      }
      accepted.push(f);
      existing.add(key);
    });

    const spaceLeft = MAX_FILES - files.length;
    const toAdd = accepted.slice(0, Math.max(spaceLeft, 0));
    if (accepted.length > toAdd.length) rejected = true;

    if (rejected) toast.push(t("some_files_rejected"), "error");
    if (toAdd.length > 0) {
      const nextFiles = [...files, ...toAdd];
      setFiles(nextFiles);
      if (nextFiles.length <= MAX_FILES) {
        setErrors((prev) => {
          if (!prev.attachments) return prev;
          const next = { ...prev };
          delete next.attachments;
          return next;
        });
      }
    }
    if (files.length + accepted.length > MAX_FILES) {
      setErrors((prev) => ({ ...prev, attachments: `Please limit attachments to ${MAX_FILES} files.` }));
    }
    e.target.value = "";
  };

  const removeFile = (name) => {
    setFiles((prev) => {
      const nextFiles = prev.filter((f) => f.name !== name);
      setErrors((errs) => {
        if (!errs.attachments) return errs;
        if (nextFiles.length <= MAX_FILES) {
          const cleared = { ...errs };
          delete cleared.attachments;
          return cleared;
        }
        return errs;
      });
      return nextFiles;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.push(t("please_sign_in"), "error");
      return;
    }
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      scrollToFirstError(validation);
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

      const structuredNotes = buildStructuredNotes(form);

      await createTicket({
        ticket_number: ticketNumber,
        country: form.country.trim() || null,
        customer_name: form.customer_name.trim(),
        contact: form.contact.trim(),
        attachment_type: form.attachment_type.trim(),
        attachment_model: form.attachment_model.trim(),
        attachment_serial: form.attachment_serial.trim(),
        installed_at: form.installed_at || null,
        failed_at: form.failed_at || null,
        symptom: structuredNotes,
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

  const disableSubmit =
    submitting || !user || requiredLeft > 0 || invalidEmail || attachmentsOverLimit;

  return (
    <div className="grid gap-6">
      <form ref={formRef} className="grid gap-6" onSubmit={handleSubmit}>
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
            <Section title="Customer / Dealer information">
              <Field label={t("country") || "Country"}>
                <input
                  ref={(node) => (inputRefs.current.country = node)}
                  className="input"
                  value={form.country}
                  onChange={onChange("country")}
                />
              </Field>
              <Field label={t("name_company_required") || "Customer / company"} required error={errors.customer_name}>
                <input
                  ref={(node) => (inputRefs.current.customer_name = node)}
                  className={inputClass(errors.customer_name)}
                  value={form.customer_name}
                  onChange={onChange("customer_name")}
                />
              </Field>
              <Field label={t("contact_required") || "Contact"} required error={errors.contact}>
                <input
                  ref={(node) => (inputRefs.current.contact = node)}
                  className={inputClass(errors.contact)}
                  value={form.contact}
                  onChange={onChange("contact")}
                  placeholder="Phone number"
                />
              </Field>
              <Field label="Email">
                <input
                  ref={(node) => (inputRefs.current.email = node)}
                  className={inputClass(errors.email)}
                  type="email"
                  value={form.email}
                  onChange={onChange("email")}
                />
              </Field>
              <Field label="Dealer / Branch">
                <input
                  ref={(node) => (inputRefs.current.dealer = node)}
                  className="input"
                  value={form.dealer}
                  onChange={onChange("dealer")}
                />
              </Field>
            </Section>

            <Section title="Machine information">
              <Field label="Excavator / carrier model">
                <input
                  ref={(node) => (inputRefs.current.machine_model = node)}
                  className="input"
                  value={form.machine_model}
                  onChange={onChange("machine_model")}
                />
              </Field>
              <Field label="Carrier serial number">
                <input
                  ref={(node) => (inputRefs.current.machine_serial = node)}
                  className="input"
                  value={form.machine_serial}
                  onChange={onChange("machine_serial")}
                />
              </Field>
              <Field label="Operating hours">
                <input
                  ref={(node) => (inputRefs.current.machine_hours = node)}
                  className="input"
                  value={form.machine_hours}
                  onChange={onChange("machine_hours")}
                  placeholder="e.g., 1200h"
                />
              </Field>
            </Section>

            <Section title={t("attach_info") || "Attachment information"}>
              <Field label={t("attach_type_required") || "Attachment type"} required error={errors.attachment_type}>
                <input
                  ref={(node) => (inputRefs.current.attachment_type = node)}
                  className={inputClass(errors.attachment_type)}
                  value={form.attachment_type}
                  onChange={onChange("attachment_type")}
                />
              </Field>
              <Field label={t("model_required") || "Breaker model"} required error={errors.attachment_model}>
                <input
                  ref={(node) => (inputRefs.current.attachment_model = node)}
                  className={inputClass(errors.attachment_model)}
                  value={form.attachment_model}
                  onChange={onChange("attachment_model")}
                />
              </Field>
              <Field label={t("serial_no") || "Serial number"} required error={errors.attachment_serial}>
                <input
                  ref={(node) => (inputRefs.current.attachment_serial = node)}
                  className={inputClass(errors.attachment_serial)}
                  value={form.attachment_serial}
                  onChange={onChange("attachment_serial")}
                />
              </Field>
              <Field label="Operating hours (breaker)">
                <input
                  ref={(node) => (inputRefs.current.attachment_hours = node)}
                  className="input"
                  value={form.attachment_hours}
                  onChange={onChange("attachment_hours")}
                  placeholder="e.g., 800h"
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label={t("installed_at") || "Installation date"}>
                  <input
                    ref={(node) => (inputRefs.current.installed_at = node)}
                    type="date"
                    className="input"
                    value={form.installed_at}
                    onChange={onChange("installed_at")}
                  />
                </Field>
                <Field label={t("failed_at") || "Failure date"}>
                  <input
                    ref={(node) => (inputRefs.current.failed_at = node)}
                    type="date"
                    className="input"
                    value={form.failed_at}
                    onChange={onChange("failed_at")}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Operating conditions">
              <Field label="Working pressure">
                <input
                  ref={(node) => (inputRefs.current.operating_pressure = node)}
                  className="input"
                  value={form.operating_pressure}
                  onChange={onChange("operating_pressure")}
                  placeholder="bar / psi"
                />
              </Field>
              <Field label="Flow rate">
                <input
                  ref={(node) => (inputRefs.current.flow_rate = node)}
                  className="input"
                  value={form.flow_rate}
                  onChange={onChange("flow_rate")}
                  placeholder="L/min"
                />
              </Field>
              <Field label="Oil temperature">
                <input
                  ref={(node) => (inputRefs.current.oil_temperature = node)}
                  className="input"
                  value={form.oil_temperature}
                  onChange={onChange("oil_temperature")}
                  placeholder="°C"
                />
              </Field>
              <Field label="Working environment">
                <textarea
                  ref={(node) => (inputRefs.current.environment = node)}
                  className="input min-h-[90px]"
                  value={form.environment}
                  onChange={onChange("environment")}
                  placeholder="e.g., quarry, demolition, underwater"
                />
              </Field>
              <Field label="Carrier size / class">
                <input
                  ref={(node) => (inputRefs.current.carrier_size = node)}
                  className="input"
                  value={form.carrier_size}
                  onChange={onChange("carrier_size")}
                  placeholder="e.g., 20-22 ton"
                />
              </Field>
            </Section>

            <Section title={t("failure_details") || "Failure / symptom details"}>
              <Field label={t("symptom_required") || "Main symptom"} required error={errors.symptom}>
                <textarea
                  ref={(node) => (inputRefs.current.symptom = node)}
                  className={`${inputClass(errors.symptom)} min-h-[120px]`}
                  value={form.symptom}
                  onChange={onChange("symptom")}
                  placeholder="Describe noise, leakage, weak power, abnormal vibration, etc."
                />
              </Field>
              <Field label="Additional observations">
                <textarea
                  ref={(node) => (inputRefs.current.symptom_notes = node)}
                  className="input min-h-[90px]"
                  value={form.symptom_notes}
                  onChange={onChange("symptom_notes")}
                  placeholder="Any warning lights, error codes, or how the issue changes during operation"
                />
              </Field>
            </Section>

            <Section title="History">
              <Field label="When did the problem start?">
                <input
                  ref={(node) => (inputRefs.current.issue_started_at = node)}
                  className="input"
                  value={form.issue_started_at}
                  onChange={onChange("issue_started_at")}
                  placeholder="Date or hours"
                />
              </Field>
              <Field label="Previous repairs or inspections">
                <textarea
                  ref={(node) => (inputRefs.current.previous_repairs = node)}
                  className="input min-h-[90px]"
                  value={form.previous_repairs}
                  onChange={onChange("previous_repairs")}
                  placeholder="Parts replaced, service dates, dealer visits"
                />
              </Field>
              <Field label="Usage history">
                <textarea
                  ref={(node) => (inputRefs.current.usage_history = node)}
                  className="input min-h-[90px]"
                  value={form.usage_history}
                  onChange={onChange("usage_history")}
                  placeholder="Typical tasks, intensity, duty cycle"
                />
              </Field>
            </Section>

            <Section title={t("attachments_title") || "Attachments"}>
              <div className="text-xs text-slate-500 mb-3">
                {(t("per_file_limit") || "Per-file size limit") + ": 15MB"} · Up to {MAX_FILES} files
              </div>
              <input
                type="file"
                accept="image/*,application/pdf,video/mp4"
                multiple
                onChange={onFiles}
                className="block text-sm text-slate-700"
              />
              {errors.attachments && <div className="mt-1 text-xs text-rose-600">{errors.attachments}</div>}
              <div className="text-xs text-slate-500 mt-1">{files.length} / {MAX_FILES} selected</div>
              {files.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {files.map((f) => (
                    <li
                      key={f.name}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{f.name}</span>
                        <span className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <button type="button" className="btn btn-ghost text-xs" onClick={() => removeFile(f.name)}>
                        {t("removed")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {files.length === 0 && (
                <div className="text-xs text-slate-500">
                  Photos of the symptom, installation, and surrounding hydraulic setup are very helpful.
                </div>
              )}
            </Section>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {ticketNumber ? `#${ticketNumber}` : "#----"}
              {user && <span className="ml-2 text-xs">{t("info_signed_in_as")}: {user.email}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={disableSubmit}>
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

function Field({ label, children, required = false, error }) {
  return (
    <label className="block">
      <div className="label flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
    </label>
  );
}

function inputClass(hasError) {
  return `input ${hasError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`;
}

function buildStructuredNotes(form) {
  const main = form.symptom.trim();
  const sections = [];

  const machine = [];
  if (form.machine_model) machine.push(`Model: ${form.machine_model.trim()}`);
  if (form.machine_serial) machine.push(`Serial: ${form.machine_serial.trim()}`);
  if (form.machine_hours) machine.push(`Hours: ${form.machine_hours.trim()}`);
  if (machine.length) sections.push(["Machine information", machine]);

  const attachment = [];
  if (form.attachment_type) attachment.push(`Type: ${form.attachment_type.trim()}`);
  if (form.attachment_model) attachment.push(`Model: ${form.attachment_model.trim()}`);
  if (form.attachment_serial) attachment.push(`Serial: ${form.attachment_serial.trim()}`);
  if (form.attachment_hours) attachment.push(`Hours: ${form.attachment_hours.trim()}`);
  if (form.installed_at) attachment.push(`Installation date: ${form.installed_at}`);
  if (form.failed_at) attachment.push(`Failure date: ${form.failed_at}`);
  if (attachment.length) sections.push(["Attachment information", attachment]);

  const operating = [];
  if (form.operating_pressure) operating.push(`Working pressure: ${form.operating_pressure.trim()}`);
  if (form.flow_rate) operating.push(`Flow rate: ${form.flow_rate.trim()}`);
  if (form.oil_temperature) operating.push(`Oil temperature: ${form.oil_temperature.trim()}`);
  if (form.environment) operating.push(`Environment: ${form.environment.trim()}`);
  if (form.carrier_size) operating.push(`Carrier size: ${form.carrier_size.trim()}`);
  if (operating.length) sections.push(["Operating conditions", operating]);

  const history = [];
  if (form.issue_started_at) history.push(`Problem started: ${form.issue_started_at.trim()}`);
  if (form.previous_repairs) history.push(`Previous repairs: ${form.previous_repairs.trim()}`);
  if (form.usage_history) history.push(`Usage history: ${form.usage_history.trim()}`);
  if (history.length) sections.push(["History", history]);

  if (form.symptom_notes) sections.push(["Additional observations", [form.symptom_notes.trim()]]);

  if (sections.length === 0) return main;

  const detail = sections
    .map(([title, rows]) => `${title}\n- ${rows.join("\n- ")}`)
    .join("\n\n");

  return `${main}\n\n---\n${detail}`.trim();
}
