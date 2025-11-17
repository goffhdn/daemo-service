// src/components/LoginDialog.jsx
import { useState } from "react";
import { signInWithEmail, signUpWithPassword, signInWithPassword } from "../integrations/Core";

export default function LoginDialog({ onClose }) {
  const [tab, setTab] = useState("magic"); // 'magic' | 'password'
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-soft max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold">Sign in</div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
        <div className="p-5">
          <div className="flex gap-2 mb-4">
            <button className={`btn ${tab==='magic'?'btn-primary':'btn-ghost'}`} onClick={() => setTab('magic')}>Magic link</button>
            <button className={`btn ${tab==='password'?'btn-primary':'btn-ghost'}`} onClick={() => setTab('password')}>Email & Password</button>
          </div>
          {tab === 'magic' ? <MagicForm /> : <PasswordForm />}
        </div>
      </div>
    </div>
  );
}

function MagicForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (e2) {
      setErr(e2.message || "로그인 오류");
    }
  };

  return sent ? (
    <div className="text-sm text-slate-700">로그인 링크를 이메일로 보냈습니다. 메일함을 확인해 주세요.</div>
  ) : (
    <form onSubmit={submit} className="grid gap-3">
      <label className="label">Email</label>
      <input className="input" type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="flex gap-2 justify-end pt-2">
        <button type="submit" className="btn btn-primary">Send magic link</button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    try {
      if (mode === "signup") {
        await signUpWithPassword(email, pw);
        setOk("계정이 생성되었습니다. 이제 로그인하세요.");
        setMode("signin");
      } else {
        await signInWithPassword(email, pw);
        setOk("로그인되었습니다. 창을 닫아주세요.");
      }
    } catch (e2) {
      setErr(e2.message || "오류");
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="label">Email</label>
      <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      <label className="label">Password</label>
      <input className="input" type="password" value={pw} onChange={(e)=>setPw(e.target.value)} required />
      {err && <div className="text-sm text-red-600">{err}</div>}
      {ok && <div className="text-sm text-emerald-700">{ok}</div>}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500">모드: {mode}</div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={()=>setMode(mode==='signin'?'signup':'signin')}>
            {mode==='signin' ? 'Create account' : 'Go to sign in'}
          </button>
          <button type="submit" className="btn btn-primary">{mode==='signin' ? 'Sign in' : 'Sign up'}</button>
        </div>
      </div>
    </form>
  );
}
