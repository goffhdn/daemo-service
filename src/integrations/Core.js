// src/integrations/Core.js
import { createClient } from "@supabase/supabase-js";

/* =========================
   ENV & SUPABASE CLIENT
   ========================= */
const RAW_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const RAW_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function ensureValidUrl(u) {
  try {
    const o = new URL(u);
    if (!/^https?:$/.test(o.protocol)) throw new Error("protocol");
    return u;
  } catch {
    throw new Error(
      `Invalid VITE_SUPABASE_URL: "${u}". 예: https://<project-id>.supabase.co (http 금지, 공백/슬래시 금지)`
    );
  }
}
if (!RAW_URL || !RAW_KEY) {
  throw new Error("Supabase env missing: .env에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 설정 필요");
}

export const supabase = createClient(ensureValidUrl(RAW_URL), RAW_KEY);

// (필요하면 지워도 되는 확인 로그)
console.log("[ENV] URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("[ENV] ANON prefix =", import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 12));

/* =========================
   AUTH
   ========================= */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

// 매직링크 로그인
export async function signInWithEmail(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

// 이메일+패스워드
export async function signUpWithPassword(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}
export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

/* =========================
   PROFILE
   (profiles 테이블: PK = id(auth.user.id))
   ========================= */
export async function getMyProfile() {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const user = auth?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 프로필이 아직 없으면 null
  if (error && (error.code === "PGRST116" || error.message?.includes("No rows"))) {
    return null;
  }
  if (error) throw error;
  return data;
}

// 없으면 기본 프로필 생성
export async function ensureMyProfile(defaults = {}) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      [{ id: user.id, email: user.email, ...defaults }],
      { onConflict: "id", ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* =========================
   TICKETS
   ========================= */
// 다음 접수번호: RPC가 있으면 사용, 없으면 fallback
export async function getNextTicketNumber() {
  try {
    const { data, error } = await supabase.rpc("get_next_ticket_number");
    if (error) throw error;
    if (typeof data === "number") return data;
  } catch (_) { /* ignore */ }
  const { data: rows, error: e2 } = await supabase
    .from("tickets")
    .select("ticket_number")
    .order("ticket_number", { ascending: false })
    .limit(1);
  if (e2) throw e2;
  return (rows?.[0]?.ticket_number || 1000) + 1;
}

// 첨부 업로드 (Storage bucket: 'attachments')
export async function uploadAttachment(file) {
  const bucket = "attachments";
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${ymd}/${rand}-${encodeURIComponent(file.name)}`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createTicket(payload) {
  const { data, error } = await supabase.from("tickets").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function listMyTickets() {
  const { data: sess } = await supabase.auth.getUser();
  const email = sess?.user?.email;
  if (!email) return [];
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("created_by", email)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// staff/admin 전용
export async function listAllTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTicketById(id) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// 상태 변경: DB RPC 사용 (권한 검증은 DB에서 처리)
export async function setTicketStatus(id, nextStatus) {
  const allow = ["received", "in_progress", "completed", "on_hold", "cancelled"];
  if (!allow.includes(nextStatus)) throw new Error("invalid status");

  const { error } = await supabase.rpc("admin_set_ticket_status", {
    p_id: id,
    p_status: nextStatus,
  });

  if (error) throw error;
  return true;
}


/* =========================
   MISC
   ========================= */
export async function pingSupabase() {
  const { data, error } = await supabase.from("tickets").select("id").limit(1);
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: data?.length ?? 0 };
}
