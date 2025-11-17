// src/i18n/I18nProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STR } from "./strings";

const I18nCtx = createContext(null);
const KEY = "lang";

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(KEY) || "en");

  useEffect(() => {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (k, vars) => {
    const base = STR[lang]?.[k] ?? STR.en[k] ?? k;
    if (!vars) return base;
    return Object.entries(vars).reduce((s, [key, val]) => s.replaceAll(`{{${key}}}`, String(val)), base);
  };

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
