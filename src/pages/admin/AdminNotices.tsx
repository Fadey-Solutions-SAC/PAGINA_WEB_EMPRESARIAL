import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../../lib/api";

const PLANS = [
  { key: "basico", label: "Básico" },
  { key: "emprendedor", label: "Emprendedor" },
  { key: "profesional", label: "Profesional" },
  { key: "negocio", label: "Negocio" },
  { key: "premium", label: "Premium" },
];

type Notice = {
  id: string;
  title: string;
  message: string;
  audience: "all" | "plans";
  target_plans: string[];
  expires_at: string | null;
  created_by: string;
  restaurant_name: string;
  created_at: string;
};

type Props = {
  token: string | null;
  onError: (msg: string) => void;
  onToast: (msg: string) => void;
};

function planLabel(key: string) {
  return PLANS.find((plan) => plan.key === key)?.label || key;
}

export function AdminNotices({ token, onError, onToast }: Props) {
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "plans">("all");
  const [plans, setPlans] = useState<string[]>([]);
  const [duration, setDuration] = useState("1");
  const [unit, setUnit] = useState<"hours" | "days">("hours");
  const [noExpiry, setNoExpiry] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useMemo(() => {
    return async () => {
      if (!token) return;
      const data = await api<{ notices: Notice[] }>("/api/notices", { token });
      setNotices(Array.isArray(data.notices) ? data.notices : []);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    setLoading(true);
    load()
      .catch((err: unknown) => {
        if (!cancel) onError(err instanceof Error ? err.message : "No se pudieron leer los avisos");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [token, load, onError]);

  function togglePlan(key: string) {
    setPlans((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  async function publish(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (audience === "plans" && plans.length === 0) {
      onError("Elige al menos un plan");
      return;
    }
    const value = Math.max(1, Number(duration) || 1);
    setSaving(true);
    try {
      await api("/api/notices", {
        method: "POST",
        token,
        body: JSON.stringify({
          title,
          message,
          audience,
          target_plans: audience === "plans" ? plans : [],
          duration_hours: noExpiry ? null : unit === "days" ? value * 24 : value,
        }),
      });
      setTitle("");
      setMessage("");
      setAudience("all");
      setPlans([]);
      setDuration("1");
      setUnit("hours");
      setNoExpiry(false);
      onToast("Notificación publicada");
      await load();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!token) return;
    if (!window.confirm("¿Eliminar esta notificación de todos los restaurantes?")) return;
    try {
      await api(`/api/notices/${encodeURIComponent(id)}`, { method: "DELETE", token });
      setNotices((prev) => prev.filter((row) => row.id !== id));
      onToast("Notificación eliminada");
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  if (loading) {
    return <div className="admin__skeleton" style={{ height: 140 }} />;
  }

  return (
    <div className="admin__grid-2">
      <div className="admin__card">
        <div className="admin__card-head">
          <h2>Publicar notificación</h2>
        </div>
        <div className="admin__card-body">
          <form onSubmit={(e) => void publish(e)} className="admin__form">
            <label className="admin__field">
              Título
              <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="admin__field">
              Mensaje
              <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <div className="admin__field">
              Destino
              <label>
                <input
                  type="radio"
                  checked={audience === "all"}
                  onChange={() => {
                    setAudience("all");
                    setPlans([]);
                  }}
                />{" "}
                Todos los planes
              </label>
              <label>
                <input type="radio" checked={audience === "plans"} onChange={() => setAudience("plans")} />{" "}
                Planes específicos
              </label>
              {audience === "plans" ? (
                <div>
                  {PLANS.map((plan) => (
                    <label key={plan.key} style={{ marginRight: "0.8rem" }}>
                      <input
                        type="checkbox"
                        checked={plans.includes(plan.key)}
                        onChange={() => togglePlan(plan.key)}
                      />{" "}
                      {plan.label}
                    </label>
                  ))}
                </div>
              ) : (
                <p>Llega a todos los Resto FADEY conectados.</p>
              )}
            </div>
            <label className="admin__field">
              Duración
              <input
                type="number"
                min={1}
                value={duration}
                disabled={noExpiry}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>
            <label className="admin__field">
              Unidad
              <select value={unit} disabled={noExpiry} onChange={(e) => setUnit(e.target.value === "days" ? "days" : "hours")}>
                <option value="hours">Horas</option>
                <option value="days">Días</option>
              </select>
            </label>
            <label>
              <input type="checkbox" checked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)} /> Sin vencimiento
            </label>
            <button type="submit" className="admin__btn admin__btn--primary" disabled={saving}>
              {saving ? "Publicando…" : "Publicar notificación"}
            </button>
          </form>
        </div>
      </div>
      <div className="admin__card">
        <div className="admin__card-head">
          <h2>Historial</h2>
        </div>
        <div className="admin__card-body">
          {notices.length === 0 ? (
            <div className="admin__empty">
              <strong>No hay notificaciones vigentes</strong>
              Cuando vence la fecha, el aviso se borra solo de la base.
            </div>
          ) : (
            notices.map((notice) => (
              <article key={notice.id} style={{ marginBottom: "0.9rem" }}>
                <strong>{notice.title}</strong>
                <p>{notice.message}</p>
                <p>
                  {notice.audience === "plans"
                    ? `Planes: ${notice.target_plans.map(planLabel).join(", ")}`
                    : "Todos los planes"}
                  {notice.restaurant_name ? ` · ${notice.restaurant_name}` : ""}
                  {" · "}
                  {notice.created_by}
                </p>
                <p>{notice.expires_at ? `Vence ${new Date(notice.expires_at).toLocaleString("es-PE")}` : "Sin vencimiento"}</p>
                <button type="button" className="admin__btn admin__btn--danger" onClick={() => void remove(notice.id)}>
                  Eliminar
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
