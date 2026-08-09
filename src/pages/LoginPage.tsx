import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import "./Login.css";

export function LoginPage() {
  const { auth, loginAdmin, loginClient } = useAuth();
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

    const user = username.trim();
    const pass = password;

    try {
      if (!user) {
        if (!pass) {
          setError("Ingrese usuario y contraseña");
          return;
        }
        try {
          await loginAdmin(pass);
        } catch {
          setError("Ingrese usuario y contraseña");
        }
        return;
      }

      if (!pass) {
        setError("Credenciales inválidas");
        return;
      }

      try {
        await loginClient(user, pass);
      } catch {
        setError("Credenciales inválidas");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login__bg" aria-hidden="true" />
      <div className="login__grid" aria-hidden="true" />
      <div className="login__glow login__glow--a" aria-hidden="true" />
      <div className="login__glow login__glow--b" aria-hidden="true" />
      <div className="login__glow login__glow--c" aria-hidden="true" />

      <div className="login__shell">
        <header className="login__brand">
          <img
            src="/logo-fadey.png"
            alt=""
            width={56}
            height={56}
            decoding="async"
          />
          <div>
            <p className="login__brand-name">
              Fadey <em>Solutions</em> SAC
            </p>
            <p className="login__brand-tag">Academia · Tutoriales · Gestión</p>
          </div>
        </header>

        <div className="login__panel">
          <Link to="/" className="login__back">
            ← Volver al sitio
          </Link>
          <h1>Acceder</h1>
          <p className="login__lead">
            Ingresa con tus credenciales para continuar.
          </p>

          <form onSubmit={onSubmit} className="login__form">
            <label>
              Usuario
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Tu usuario"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                required
              />
            </label>
            {error && (
              <p className="login__error" role="alert">
                {error}
              </p>
            )}
            <button className="login__submit" type="submit" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="login__foot">Tecnología que impulsa tu negocio</p>
      </div>
    </div>
  );
}
