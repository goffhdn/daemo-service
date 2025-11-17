// src/main.jsx
import React, { useEffect, useState, Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ErrorOverlay from "./components/ErrorOverlay.jsx";

/**
 * 진단 부팅 모드 + AuthProvider 래핑
 * - App.jsx / react-router-dom / AuthProvider 모두 동적 import
 * - 어느 단계에서 실패해도 화면에 빨간 박스로 원인 표시
 */

function Boot() {
  const [AppComp, setAppComp] = useState(null);
  const [appErr, setAppErr] = useState(null);

  useEffect(() => {
    import("./App.jsx")
      .then((m) => setAppComp(() => m.default))
      .catch((e) => setAppErr(e));
  }, []);

  useEffect(() => {
    const onErr = (e) => console.error("window.error:", e.error || e.message || e);
    const onRej = (e) => console.error("unhandledrejection:", e.reason || e);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  if (appErr) {
    return (
      <ErrorOverlay
        title="App.jsx를 불러오지 못했습니다"
        message={appErr.message || appErr}
        stack={appErr.stack}
      />
    );
  }
  if (!AppComp) return <StatusBox>Booting… (App.jsx 불러오는 중)</StatusBox>;
  return <AppWithDeps AppComp={AppComp} />;
}

function AppWithDeps({ AppComp }) {
  const [router, setRouter] = useState(null);
  const [routerErr, setRouterErr] = useState(null);

  const [AuthProvider, setAuthProvider] = useState(null);
  const [authErr, setAuthErr] = useState(null);

  // react-router-dom 불러오기 (ESM)
  useEffect(() => {
    import("react-router-dom")
      .then((mod) => setRouter(mod))
      .catch((e) => setRouterErr(e));
  }, []);

  // AuthProvider 불러오기 (ESM)
  useEffect(() => {
    import("./auth/AuthProvider.jsx")
      .then((m) => setAuthProvider(() => m.AuthProvider))
      .catch((e) => setAuthErr(e));
  }, []);

  if (routerErr) {
    return (
      <ErrorOverlay
        title="react-router-dom을 불러오지 못했습니다"
        message={routerErr.message || routerErr}
        stack={routerErr.stack}
      />
    );
  }
  if (authErr) {
    return (
      <ErrorOverlay
        title="AuthProvider를 불러오지 못했습니다"
        message={authErr.message || authErr}
        stack={authErr.stack}
      />
    );
  }
  if (!router) return <StatusBox>Routing 라이브러리 불러오는 중…</StatusBox>;
  if (!AuthProvider) return <StatusBox>AuthProvider 불러오는 중…</StatusBox>;

  const { BrowserRouter, Routes, Route, Navigate } = router;

  const ServiceRequest = lazyWrap(() => import("./Pages/ServiceRequest.jsx"), "ServiceRequest.jsx");
  const MyRequests = lazyWrap(() => import("./Pages/MyRequests.jsx"), "MyRequests.jsx");
  const ServiceDashboard = lazyWrap(() => import("./Pages/ServiceDashboard.jsx"), "ServiceDashboard.jsx");

  return (
    <RenderCatcher>
      <AuthProvider>
        <Suspense fallback={<StatusBox>페이지 불러오는 중…</StatusBox>}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppComp />}>
                <Route index element={<ServiceRequest />} />
                <Route path="request" element={<ServiceRequest />} />
                <Route path="my" element={<MyRequests />} />
                <Route path="dashboard" element={<ServiceDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </Suspense>
      </AuthProvider>
    </RenderCatcher>
  );
}

function lazyWrap(loader, label) {
  return lazy(async () => {
    try {
      const m = await loader();
      return m;
    } catch (e) {
      throw new Error(`${label} import 실패: ${e.message || e}`);
    }
  });
}

class RenderCatcher extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("Render error:", err, info); }
  render() {
    if (this.state.err) {
      return (
        <ErrorOverlay
          title="화면 렌더링 중 오류가 발생했습니다"
          message={this.state.err.message || this.state.err}
          stack={this.state.err.stack}
        />
      );
    }
    return this.props.children;
  }
}

function StatusBox({ children }) {
  return (
    <div style={{
      maxWidth: 1000, margin: "24px auto", padding: 16, borderRadius: 12,
      border: "1px solid #e5e7eb", background: "#f8fafc", color: "#111827",
      fontFamily: "ui-sans-serif, system-ui"
    }}>
      {children}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Boot />);
