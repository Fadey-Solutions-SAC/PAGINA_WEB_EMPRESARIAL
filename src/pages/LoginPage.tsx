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
  const [showPassword, setShowPassword] = useState(false);

  if (auth.status === "ready") {
    return (
      <Navigate to={auth.role === "admin" ? "/admin" : "/academia"} replace />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const user = username.trim();
    const pass = password.trim();

    try {
      if (!user) {
        if (!pass) {
          setError("Ingrese usuario y contraseña");
          return;
        }
        try {
          await loginAdmin(pass);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          if (
            msg.includes("conectar") ||
            msg.includes("servidor") ||
            msg.includes("JWT") ||
            msg.includes("Failed")
          ) {
            setError(msg || "No se pudo conectar con el servidor");
          } else {
            setError("Ingrese usuario y contraseña");
          }
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
          <div className="login__brand-text">
            <p className="login__brand-name">
              Fadey <em>Solutions</em> SAC
            </p>
            <p className="login__brand-tag">Academia Fadey</p>
          </div>
        </header>

        <div className="login__panel">
          <Link to="/" className="login__back">
            ← Volver al sitio
          </Link>
          <h2>Acceder</h2>
          <p className="login__lead">
            Ingresa con tus credenciales para continuar.
          </p>

          <form
            onSubmit={onSubmit}
            className="login__form"
            autoComplete="off"
          >
            <label>
              Usuario
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                name="fadey-login-user"
                autoComplete="off"
                placeholder="Tu usuario"
              />
            </label>
            <label>
              Contraseña
              <span className="login__pass-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="fadey-login-pass"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="login__pass-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Ver contraseña"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.3 21.3 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.4 21.4 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </span>
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
