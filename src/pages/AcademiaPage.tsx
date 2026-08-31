import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth, type Product } from "../lib/auth";
import "./Portal.css";

type Course = {
  id: string;
  product: Product;
  kind: "tutorial" | "academia";
  title: string;
  youtubeUrl: string;
  embedUrl: string;
};

type ProgressRow = {
  moduleId: string;
  completed: boolean;
};

const PRODUCT_LABEL: Record<Product, string> = {
  resto: "Resto Fadey",
  erp: "ERP Fadey",
  web: "Desarrollo web",
  soporte: "Soporte",
};

export function AcademiaPage() {
  const { token, logout, auth, isImpersonating, exitImpersonation } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const products =
    auth.status === "ready" && auth.role === "client" ? auth.products || [] : [];

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [c, p] = await Promise.all([
        api<Course[]>("/api/courses", { token }),
        api<ProgressRow[]>("/api/progress", { token }),
      ]);
      setCourses(c);
      setProgress(p);
      setActiveId((prev) => prev ?? c[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const doneSet = useMemo(
    () => new Set(progress.filter((p) => p.completed).map((p) => p.moduleId)),
    [progress],
  );

  const tutorials = courses.filter((c) => c.kind === "tutorial");
  const academia = courses.filter((c) => c.kind === "academia");
  const active = courses.find((c) => c.id === activeId) || null;

  const total = courses.length;
  const done = courses.filter((c) => doneSet.has(c.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function markDone(moduleId: string) {
    if (!token) return;
    await api(`/api/progress/${moduleId}`, {
      method: "POST",
      token,
      body: JSON.stringify({ completed: true }),
    });
    setProgress((prev) => {
      const rest = prev.filter((p) => p.moduleId !== moduleId);
      return [...rest, { moduleId, completed: true }];
    });
  }

  async function backToAdmin() {
    await exitImpersonation();
    navigate("/admin", { state: { section: "clientview" } });
  }

  return (
    <div className="portal portal--wide">
      {isImpersonating && (
        <div className="portal__impersonation" role="status">
          <span>
            Viendo como{" "}
            <strong>
              {auth.status === "ready" ? auth.clientName : "cliente"}
            </strong>
            {" · "}
            portal real del cliente
          </span>
          <button type="button" className="btn btn--primary" onClick={() => void backToAdmin()}>
            ← Volver al admin
          </button>
        </div>
      )}

      <header className="portal__top">
        <div>
          <h1>Academia Fadey</h1>
          <p>
            {auth.status === "ready" && auth.role === "client"
              ? `${auth.clientName} · ${products.map((p) => PRODUCT_LABEL[p]).join(", ")}`
              : "Cliente"}
          </p>
        </div>
        <div className="portal__top-actions">
          {!isImpersonating && <Link to="/">Sitio</Link>}
          <button
            type="button"
            className="btn btn--dark"
            onClick={() => (isImpersonating ? void backToAdmin() : logout())}
          >
            {isImpersonating ? "Salir de la vista" : "Salir"}
          </button>
        </div>
      </header>

      {error && <p className="portal__error">{error}</p>}

      <div className="academia__progress">
        <strong>Progreso:</strong> {done}/{total} módulos · {pct}%
        <div className="academia__bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="academia__layout">
        <aside className="academia__list">
          <h2>Tutoriales</h2>
          {tutorials.length === 0 && <p className="portal__muted">Sin tutoriales aún.</p>}
          {tutorials.map((c) => (
            <button
              key={c.id}
              type="button"
              className={activeId === c.id ? "is-active" : ""}
              onClick={() => setActiveId(c.id)}
            >
              {doneSet.has(c.id) ? "✓ " : ""}
              {c.title}
              <span>{PRODUCT_LABEL[c.product]}</span>
            </button>
          ))}
          <h2>Academia</h2>
          {academia.length === 0 && <p className="portal__muted">Sin videos de academia aún.</p>}
          {academia.map((c) => (
            <button
              key={c.id}
              type="button"
              className={activeId === c.id ? "is-active" : ""}
              onClick={() => setActiveId(c.id)}
            >
              {doneSet.has(c.id) ? "✓ " : ""}
              {c.title}
              <span>{PRODUCT_LABEL[c.product]}</span>
            </button>
          ))}
        </aside>

        <div className="academia__player">
          {active ? (
            <>
              <h2>{active.title}</h2>
              <p className="portal__muted">
                {PRODUCT_LABEL[active.product]} · {active.kind}
              </p>
              <div className="academia__frame">
                <iframe
                  title={active.title}
                  src={active.embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {!doneSet.has(active.id) && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => void markDone(active.id)}
                >
                  Marcar como visto
                </button>
              )}
            </>
          ) : (
            <p className="portal__muted">
              Cuando el admin publique videos de tu producto, aparecerán aquí.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
