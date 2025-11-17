// src/App.jsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Globe, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import LoginDialog from "./components/LoginDialog";
import { ToastProvider } from "./components/Toast";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <div className="app-shell">
          <div className="app-grid">
            <Sidebar />
            <MainPane />
          </div>
        </div>
      </ToastProvider>
    </I18nProvider>
  );
}

function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const { t } = useI18n();

  return (
    <aside className="sidebar">
      <div className="side-inner">
        <div className="side-logo">
          <div className="w-8 h-8 rounded-xl bg-slate-900" />
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">{t("app_title")}</div>
            <div className="text-xs text-slate-500">{t("app_sub")}</div>
          </div>
        </div>

        <nav className="side-nav">
          <SideItem to="/request" icon={<FileText size={16} />} label={t("nav_request")} />
          <SideItem to="/my" icon={<FileText size={16} />} label={t("nav_my")} />
          <SideItem to="/dashboard" icon={<LayoutDashboard size={16} />} label={t("nav_dash")} />
        </nav>

        <div className="side-foot">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div>
                  <div className="text-sm text-slate-900 truncate">{user.email}</div>
                  <div className="text-xs text-slate-500">{profile?.role_type ?? "customer"}</div>
                </div>
              </div>
              <button className="side-item mt-2" onClick={signOut}>
                <LogOut size={16} /><span>{t("sign_out")}</span>
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs mb-2">{t("you_not_signed_in")}</div>
              <button className="side-item" onClick={() => setShowLogin(true)}>
                <LogIn size={16} /><span>{t("sign_in")}</span>
              </button>
            </>
          )}
        </div>

        {showLogin && <LoginDialog onClose={() => setShowLogin(false)} />}
      </div>
    </aside>
  );
}

function SideItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `side-item ${isActive ? "side-item-active" : ""}`}>
      {icon}<span className="truncate">{label}</span>
    </NavLink>
  );
}

function MainPane() {
  const { pathname } = useLocation();
  const { t, lang, setLang } = useI18n();

  const headTitle =
    pathname.startsWith("/dashboard") ? t("head_dash") :
    pathname.startsWith("/request") ? t("head_request") :
    pathname.startsWith("/my") ? t("head_my") : t("app_title");

  const headSub =
    pathname.startsWith("/dashboard") ? t("head_sub_dash") : t("head_sub_request");

  return (
    <section className="min-h-screen">
      <div className="page-head">
        <div className="max-w-6xl mx-auto px-2 flex items-center justify-between">
          <div>
            <h1 className="page-title">{headTitle}</h1>
            <p className="page-sub">{headSub}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`badge ${lang==='en'?'bg-slate-900 text-white':''}`} onClick={() => setLang("en")}>
              <Globe size={14} className="mr-1" /> English
            </button>
            <button className={`badge ${lang==='ko'?'bg-slate-900 text-white':''}`} onClick={() => setLang("ko")}>
              한국어
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2 py-8">
        <div className="card-soft">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
}
