import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme, type SiteTheme } from "../lib/theme";
import "./Login.css";

export function LoginPage() {
  const { auth, loginAdmin, loginClient } = useAuth();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  function pickTheme(next: SiteTheme) {
    setTheme(next);
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

          <div className="login__theme" role="group" aria-label="Tema del sitio">
            <span className="login__theme-label">Color del sitio</span>
            <div className="login__theme-options">
              <button
                type="button"
                className={`login__theme-btn login__theme-btn--blue ${theme === "blue" ? "is-active" : ""}`}
                aria-pressed={theme === "blue"}
                onClick={() => pickTheme("blue")}
              >
                <span className="login__theme-swatch" aria-hidden="true" />
                Azul / celeste
              </button>
              <button
                type="button"
                className={`login__theme-btn login__theme-btn--emerald ${theme === "emerald" ? "is-active" : ""}`}
                aria-pressed={theme === "emerald"}
                onClick={() => pickTheme("emerald")}
              >
                <span className="login__theme-swatch" aria-hidden="true" />
                Verde esmeralda
              </button>
            </div>
          </div>

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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="fadey-login-pass"
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
