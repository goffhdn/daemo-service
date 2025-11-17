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

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub?.subscription?.unsubscribe();
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
