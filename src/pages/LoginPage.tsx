import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import "./Portal.css";

export function LoginPage() {
  const { auth, loginAdmin, loginClient } = useAuth();
  const [mode, setMode] = useState<"client" | "admin">("client");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (auth.status === "ready") {
    return <Navigate to={auth.role === "admin" ? "/admin" : "/academia"} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "admin") await loginAdmin(password);
      else await loginClient(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal">
      <div className="portal__card">
        <Link to="/" className="portal__back">
          ← Volver al sitio
        </Link>
        <h1>Acceder</h1>
        <p className="portal__lead">
          Clientes: Academia y tutoriales. Admin: panel de gestión.
        </p>
        <div className="portal__tabs">
          <button
            type="button"
            className={mode === "client" ? "is-active" : ""}
            onClick={() => setMode("client")}
          >
            Cliente
          </button>
          <button
            type="button"
            className={mode === "admin" ? "is-active" : ""}
            onClick={() => setMode("admin")}
          >
            Admin
          </button>
        </div>
        <form onSubmit={onSubmit} className="portal__form">
          {mode === "client" && (
            <label>
              Usuario
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
          )}
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "admin" ? "current-password" : "current-password"}
              required
            />
          </label>
          {error && <p className="portal__error">{error}</p>}
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
