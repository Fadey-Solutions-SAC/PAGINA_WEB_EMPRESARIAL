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
  const [activeSection, setActiveSection] = useState<"tutorial" | "academia">("tutorial");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [c, p] = await Promise.all([
        api<Course[]>("/api/courses", { token }),
        api<ProgressRow[]>("/api/progress", { token }),
      ]);
      setCourses(c);
      setProgress(p);
      const firstTutorial = c.find((item) => item.kind === "tutorial");
      setActiveId((prev) => {
        if (prev && c.some((item) => item.id === prev)) return prev;
        return firstTutorial?.id ?? c[0]?.id ?? null;
      });
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
  const academiaCourses = courses.filter((c) => c.kind === "academia");
  const sectionCourses = activeSection === "tutorial" ? tutorials : academiaCourses;
  const active = sectionCourses.find((c) => c.id === activeId) || sectionCourses[0] || null;

  const clientName =
    auth.status === "ready" && auth.role === "client" ? auth.clientName : "";

  function selectSection(section: "tutorial" | "academia") {
    setActiveSection(section);
    const next =
      section === "tutorial"
        ? tutorials[0]?.id ?? null
        : academiaCourses[0]?.id ?? null;
    setActiveId(next);
  }

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
      <header className="portal__top">
        <div>
          <h1>Academia Fadey</h1>
        </div>
        <div className="portal__top-actions">
          {clientName && (
            <span className="portal__client-name">{clientName}</span>
          )}
          {!isImpersonating && <Link to="/">Sitio</Link>}
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
        <aside className="academia__nav">
          <div className="academia__nav-main">
            <button
              type="button"
              className={activeSection === "tutorial" ? "is-active" : ""}
              onClick={() => selectSection("tutorial")}
            >
              Tutorial
            </button>
            <button
              type="button"
              className={activeSection === "academia" ? "is-active" : ""}
              onClick={() => selectSection("academia")}
            >
              Academia
            </button>
          </div>
          <button
            type="button"
            className="academia__nav-logout"
            onClick={() => (isImpersonating ? void backToAdmin() : logout())}
          >
            Cerrar sesión
          </button>
        </aside>

        <div className="academia__player">
          {sectionCourses.length > 1 && (
            <div className="academia__module-tabs">
              {sectionCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={active?.id === c.id ? "is-active" : ""}
                  onClick={() => setActiveId(c.id)}
                >
                  {doneSet.has(c.id) ? "✓ " : ""}
                  {c.title}
                </button>
              ))}
            </div>
          )}

          {active ? (
            <>
              <h2>{active.title}</h2>
              <p className="portal__muted">{PRODUCT_LABEL[active.product]}</p>
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
              {activeSection === "tutorial"
                ? "Cuando el admin publique tutoriales de tu producto, aparecerán aquí."
                : "Cuando el admin publique videos de academia de tu producto, aparecerán aquí."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
