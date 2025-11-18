// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, getCurrentUser, getMyProfile, signOut as coreSignOut } from "../integrations/Core";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    try {
      const u = await getCurrentUser();
      setUser(u);
      if (u) {
        const p = await getMyProfile();
        setProfile(p);
      } else {
        setProfile(null);
      }
    } finally {
      setReady(true);
    }
  }

  // 이메일 매직 링크 등으로 돌아왔을 때 세션 교환 처리
  async function handleAuthCallback() {
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.get("code");
    const hasAccessToken = url.hash.includes("access_token");
    if (!hasCode && !hasAccessToken) return;

    const { error } = await supabase.auth.exchangeCodeForSession(url.href);
    if (error) throw error;

    // 주소창 정리 (뒤로가기 시 재교환 방지)
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("token_hash");
    url.hash = "";
    window.history.replaceState({}, document.title, url.toString());
  }

  useEffect(() => {
    let unsub = null;

    (async () => {
      try {
        await handleAuthCallback();
      } catch (e) {
        console.error("Auth callback 처리 오류", e);
      }

      await refresh();
      const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
      unsub = sub?.subscription?.unsubscribe || null;
    })();

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    ready,
    signOut: async () => {
      await coreSignOut();
      await refresh();
    },
  }), [user, profile, ready]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
