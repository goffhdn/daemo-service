// src/auth/Guards.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }) {
  const { ready, user } = useAuth();
  if (!ready) return <div className="container-narrow py-10">Loading...</div>;
  if (!user) return <Navigate to="/request" replace />;
  return children;
}

export function RequireRole({ children, roles = [] }) {
  const { ready, user, profile } = useAuth();
  if (!ready) return <div className="container-narrow py-10">Loading...</div>;
  if (!user) return <Navigate to="/request" replace />;
  if (!roles.includes(profile?.role_type)) return <Navigate to="/my" replace />;
  return children;
}
