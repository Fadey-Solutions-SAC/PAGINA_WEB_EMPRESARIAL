import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import type { Product } from "../../lib/auth";
import "../Portal.css";

type ClientRow = {
  id: string;
  username: string;
  clientName: string;
  products: Product[];
  active: boolean;
};

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

type PortalPreview = {
  user: ClientRow;
  courses: Course[];
  progress: ProgressRow[];
};

const PRODUCT_LABEL: Record<Product, string> = {
  resto: "Resto Fadey",
  erp: "ERP Fadey",
  web: "Desarrollo web",
  soporte: "Soporte",
};

function badgeClass(p: Product) {
  return `admin__badge admin__badge--${p}`;
}

type Props = {
  token: string | null;
  clients: ClientRow[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onError: (msg: string) => void;
  search: string;
};

function ClientPortalPreview({
  token,
  userId,
  onBack,
  onError,
}: {
  token: string;
  userId: string;
  onBack: () => void;
  onError: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalPreview | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const preview = await api<PortalPreview>(
        `/api/users/${userId}/portal-preview`,
        { token },
      );
      setData(preview);
      setActiveId((prev) => prev ?? preview.courses[0]?.id ?? null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo cargar la vista");
    } finally {
      setLoading(false);
    }
  }, [onError, token, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const doneSet = useMemo(
    () =>
      new Set(
        (data?.progress || [])
          .filter((p) => p.completed)
          .map((p) => p.moduleId),
      ),
    [data?.progress],
  );

  const courses = data?.courses || [];
  const tutorials = courses.filter((c) => c.kind === "tutorial");
  const academia = courses.filter((c) => c.kind === "academia");
  const active = courses.find((c) => c.id === activeId) || null;
  const total = courses.length;
  const done = courses.filter((c) => doneSet.has(c.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return <div className="admin__skeleton" style={{ height: 420 }} />;
  }

  if (!data) {
    return (
      <div className="admin__empty">
        <strong>No se pudo cargar el portal</strong>
        <button type="button" className="admin__btn" onClick={onBack}>
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="client-view-portal">
      <div className="client-view-portal__bar">
        <button type="button" className="admin__btn admin__btn--ghost" onClick={onBack}>
          ← Lista de clientes
        </button>
        <span className="client-view-portal__tag">Vista previa admin</span>
      </div>

      <div className="portal portal--wide client-view-portal__shell">
        <header className="portal__top">
          <div>
            <h1>Academia Fadey</h1>
            <p>
              {data.user.clientName} ·{" "}
              {data.user.products.map((p) => PRODUCT_LABEL[p]).join(", ")}
            </p>
          </div>
          <div className="portal__top-actions">
            <span className={`admin__badge ${data.user.active ? "admin__badge--ok" : "admin__badge--off"}`}>
              {data.user.active ? "Activo" : "Inactivo"}
            </span>
            <code>{data.user.username}</code>
          </div>
        </header>

        <div className="academia__progress">
          <strong>Progreso:</strong> {done}/{total} módulos · {pct}%
          <div className="academia__bar">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="academia__layout">
          <aside className="academia__list">
            <h2>Tutoriales</h2>
            {tutorials.length === 0 && (
              <p className="portal__muted">Sin tutoriales para sus productos.</p>
            )}
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
            {academia.length === 0 && (
              <p className="portal__muted">Sin videos de academia para sus productos.</p>
            )}
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
                {doneSet.has(active.id) ? (
                  <p className="portal__muted">Marcado como visto por el cliente</p>
                ) : (
                  <p className="portal__muted">Pendiente para el cliente</p>
                )}
              </>
            ) : (
              <p className="portal__muted">
                Cuando publiques videos de sus productos, aparecerán aquí.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminClientView({
  token,
  clients,
  selectedId,
  onSelect,
  onError,
  search,
}: Props) {
  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.products.some((p) => PRODUCT_LABEL[p].toLowerCase().includes(q)),
    );
  }, [clients, q]);

  if (selectedId && token) {
    return (
      <ClientPortalPreview
        token={token}
        userId={selectedId}
        onBack={() => onSelect(null)}
        onError={onError}
      />
    );
  }

  return (
    <div className="admin__card client-view-list">
      <div className="admin__card-head">
        <div>
          <h2>Vista de cliente</h2>
          <p className="client-view-list__sub">
            Elige un cliente para ver su portal de academia tal como lo ve él.
          </p>
        </div>
      </div>
      <div className="admin__card-body">
        {filtered.length === 0 ? (
          <div className="admin__empty">
            <strong>
              {clients.length === 0
                ? "Aún no hay clientes vinculados"
                : "Ningún cliente coincide con la búsqueda"}
            </strong>
          </div>
        ) : (
          <ul className="client-view-list__grid">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="client-view-list__item"
                  onClick={() => onSelect(c.id)}
                >
                  <span className="client-view-list__name">{c.clientName}</span>
                  <span className="client-view-list__user">{c.username}</span>
                  <span className="client-view-list__meta">
                    {c.products.map((p) => (
                      <span key={p} className={badgeClass(p)}>
                        {PRODUCT_LABEL[p]}
                      </span>
                    ))}
                    <span
                      className={`admin__badge ${c.active ? "admin__badge--ok" : "admin__badge--off"}`}
                    >
                      {c.active ? "Activo" : "Off"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
