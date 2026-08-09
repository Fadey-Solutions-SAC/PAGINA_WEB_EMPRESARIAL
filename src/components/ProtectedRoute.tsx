import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";

export function ProtectedRoute({
  role,
  children,
}: {
  role: "admin" | "client";
  children: ReactNode;
}) {
  const { auth } = useAuth();

  if (auth.status === "loading") {
    return <div className="app-gate">Cargando…</div>;
  }
  if (auth.status !== "ready") {
    return <Navigate to="/login" replace />;
  }
  if (role === "admin" && auth.role !== "admin") {
    return <Navigate to="/academia" replace />;
  }
  if (role === "client" && auth.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (role === "client" && auth.role !== "client") {
    return <Navigate to="/login" replace />;
  }
  return children;
}
