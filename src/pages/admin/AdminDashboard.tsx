import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../../lib/api";

type FinanceCategory =
  | "pago"
  | "personal"
  | "servidores"
  | "publicidad"
  | "equipos"
  | "impuestos";

type FinanceEntry = {
  id: string;
  category: FinanceCategory;
  label: string;
  amount: number;
  direction: "in" | "out";
  typeLabel: string;
  createdAt: string;
};

type FinanceDashboard = {
  month: string;
  mes: number;
  personal: number;
  servidores: number;
  publicidad: number;
  equipos: number;
  impuestos: number;
  gastos: number;
  ganancias: number;
  chart: { date: string; ganancias: number; delta: number }[];
  entries: FinanceEntry[];
};

const EXPENSE_OPTIONS: { id: FinanceCategory; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "servidores", label: "Servidores" },
  { id: "publicidad", label: "Publicidad" },
  { id: "equipos", label: "Equipos" },
  { id: "impuestos", label: "Impuestos" },
];

function money(value: number) {
  return `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}

type DashGlyphName =
  | "mes"
  | "personal"
  | "servidores"
  | "publicidad"
  | "equipos"
  | "impuestos"
  | "ganancias"
  | "informes"
  | "empty"
  | "plus";

function DashGlyph({ name }: { name: DashGlyphName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "mes":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="16" rx="2.4" />
          <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
        </svg>
      );
    case "personal":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 19.5c1.15-3.35 3.35-5 7-5s5.85 1.65 7 5" />
        </svg>
      );
    case "servidores":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="3.4" width="16" height="5" rx="1.2" />
          <rect x="4" y="9.5" width="16" height="5" rx="1.2" />
          <rect x="4" y="15.6" width="16" height="5" rx="1.2" />
          <path d="M7.2 5.9h.01M7.2 12h.01M7.2 18.1h.01" />
        </svg>
      );
    case "publicidad":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 9.4v5.2h3.3L12 19.4V4.6L7.3 9.4H4Z" />
          <path d="M15.3 9a4.4 4.4 0 0 1 0 6M17.8 6.8a7.2 7.2 0 0 1 0 10.4" />
        </svg>
      );
    case "equipos":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="12.5" rx="1.8" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case "impuestos":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7 3.5h7.2L19.5 9v11.2A1.3 1.3 0 0 1 18.2 21.5H7A1.3 1.3 0 0 1 5.7 20.2V4.8A1.3 1.3 0 0 1 7 3.5Z" />
          <path d="M14.2 3.5V9h5.3M8.6 13h7M8.6 16.5h4.6" />
        </svg>
      );
    case "ganancias":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8.2 9.4V7.7a3.8 3.8 0 0 1 7.6 0v1.7" />
          <path d="M6.4 9.4h11.2c.7 0 1.3.6 1.3 1.3v7.4c0 1.8-2.9 3.4-6.9 3.4s-6.9-1.6-6.9-3.4v-7.4c0-.7.6-1.3 1.3-1.3Z" />
          <path d="M12 12.4v.2M10.55 13.7c.35-.55.9-.8 1.45-.8.75 0 1.3.45 1.3 1.05 0 .55-.4.85-1.25 1.15l-.5.18c-.95.32-1.45.78-1.45 1.55 0 .9.85 1.5 1.95 1.5.8 0 1.45-.28 1.85-.75M12 11.7v.55M12 18.1v.55" />
        </svg>
      );
    case "informes":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7 3.5h7.2L19.5 9v11.2A1.3 1.3 0 0 1 18.2 21.5H7A1.3 1.3 0 0 1 5.7 20.2V4.8A1.3 1.3 0 0 1 7 3.5Z" />
          <path d="M14.2 3.5V9h5.3M8.6 13h7M8.6 16.5h4.6" />
        </svg>
      );
    case "empty":
      return (
        <svg {...common} strokeWidth={1.55} aria-hidden="true">
          <path d="M4.8 3.8h9.2l4.6 4.6V15.2a1.8 1.8 0 0 1-1.8 1.8H6.6A1.8 1.8 0 0 1 4.8 15.2V3.8Z" />
          <path d="M14 3.8V8.6h4.6M7.4 11h4.8M7.4 13.6h2.6M9.6 15.8v-3.4M11.4 15.8v-2.1" />
          <circle cx="16.4" cy="16.6" r="3.35" />
          <path d="M18.8 19 21.4 21.6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8.2v7.6M8.2 12h7.6" />
        </svg>
      );
  }
}

function ProfitChart({ data }: { data: FinanceDashboard["chart"] }) {
  const { points } = useMemo(() => {
    const w = 280;
    const h = 108;
    if (!data.length) {
      return { points: `0,${h - 18} ${w},${h - 18}` };
    }
    const values = data.map((d) => d.ganancias);
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values, 1);
    const pad = (hi - lo) * 0.12 || 1;
    const minV = lo - pad;
    const maxV = hi + pad;
    const pts = data
      .map((d, i) => {
        const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
        const y = h - ((d.ganancias - minV) / (maxV - minV)) * (h - 8) - 4;
        return `${x},${y}`;
      })
      .join(" ");
    return { points: pts };
  }, [data]);

  return (
    <div className="dash-chart">
      <svg viewBox="0 0 280 108" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={i}
            x1={(i / 7) * 280}
            y1="4"
            x2={(i / 7) * 280}
            y2="100"
            className="dash-chart__grid"
          />
        ))}
        <polyline points={points} className="dash-chart__line" fill="none" />
      </svg>
      <div className="dash-chart__foot">
        <span>{data[0]?.date.slice(8) || "01"}</span>
        <span>Ganancias acumuladas</span>
        <span>{data[data.length - 1]?.date.slice(8) || ""}</span>
      </div>
    </div>
  );
}

type Props = {
  token: string | null;
  onError: (msg: string) => void;
  onToast: (msg: string) => void;
};

export function AdminDashboard({ token, onError, onToast }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: "personal" as FinanceCategory,
    amount: "",
    label: "",
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const dash = await api<FinanceDashboard>("/api/admin/finance/dashboard", {
        token,
      });
      setData(dash);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitEntry(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const result = await api<{ dashboard: FinanceDashboard }>(
        "/api/admin/finance/entries",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            category: form.category,
            amount: Number(form.amount),
            label: form.label.trim() || undefined,
          }),
        },
      );
      setData(result.dashboard);
      setModalOpen(false);
      setForm({ category: "personal", amount: "", label: "" });
      onToast("Informe registrado");
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  }

  const cards = [
    { key: "mes" as const, label: "Mes", value: data?.mes ?? 0 },
    { key: "personal" as const, label: "Personal", value: data?.personal ?? 0 },
    { key: "servidores" as const, label: "Servidores", value: data?.servidores ?? 0 },
    { key: "publicidad" as const, label: "Publicidad", value: data?.publicidad ?? 0 },
    { key: "equipos" as const, label: "Equipos", value: data?.equipos ?? 0 },
    { key: "impuestos" as const, label: "Impuestos", value: data?.impuestos ?? 0 },
  ];

  return (
    <div className="dash">
      <div className="dash__top">
        <div className="dash__cards">
          {cards.map((card) => (
            <article
              key={card.key}
              className={`dash-card dash-card--${card.key}`}
            >
              <span className="dash-card__icon">
                <DashGlyph name={card.key} />
              </span>
              <div className="dash-card__copy">
                <span>{card.label}</span>
                <strong>{loading ? "—" : money(card.value)}</strong>
              </div>
            </article>
          ))}
        </div>

        <aside className="dash__profit">
          <div className="dash__profit-head">
            <span className="dash-card__icon">
              <DashGlyph name="ganancias" />
            </span>
            <h2>Ganancias</h2>
            <strong className={data && data.ganancias < 0 ? "is-down" : "is-up"}>
              {loading ? "—" : money(data?.ganancias ?? 0)}
            </strong>
          </div>
          {!loading && data && <ProfitChart data={data.chart} />}
          {loading && <div className="admin__skeleton" style={{ height: 140 }} />}
        </aside>
      </div>

      <section className="dash__reports admin__card">
        <div className="admin__card-head dash__reports-head">
          <div className="dash__reports-title">
            <span className="dash-card__icon dash-card__icon--informes">
              <DashGlyph name="informes" />
            </span>
            <div>
              <h2>Informes</h2>
              <p className="dash__reports-sub">
                Movimientos del mes {data?.month || ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin__btn admin__btn--primary dash__new-btn"
            onClick={() => setModalOpen(true)}
          >
            <DashGlyph name="plus" />
            Nuevo informe
          </button>
        </div>
        <div className="admin__card-body">
          {loading ? (
            <div className="admin__skeleton" style={{ height: 160 }} />
          ) : !data?.entries.length ? (
            <div className="dash-empty">
              <span className="dash-empty__icon">
                <DashGlyph name="empty" />
              </span>
              <strong>Sin movimientos</strong>
              <p>
                Los pagos aprobados suman en Mes. Registra gastos con Nuevo informe.
              </p>
            </div>
          ) : (
            <ul className="dash-informes">
              {data.entries.map((entry) => (
                <li key={entry.id} className="dash-informe">
                  <span
                    className={`dash-informe__sign ${entry.direction === "in" ? "is-in" : "is-out"}`}
                  >
                    {entry.direction === "in" ? "+" : "−"}
                  </span>
                  <div className="dash-informe__body">
                    <strong>{entry.typeLabel}</strong>
                    {entry.label && entry.label !== entry.typeLabel && (
                      <span>{entry.label}</span>
                    )}
                  </div>
                  <div className="dash-informe__meta">
                    <em>{shortDate(entry.createdAt)}</em>
                    <strong>{money(entry.amount)}</strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {modalOpen && (
        <div
          className="admin__modal-backdrop"
          role="presentation"
          onClick={() => !submitting && setModalOpen(false)}
        >
          <div
            className="admin__modal dash-modal"
            role="dialog"
            aria-label="Nuevo informe"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Nuevo informe</h3>
            <p style={{ color: "#8fa6b8", marginTop: 0 }}>
              Registra un gasto. Se restará del mes y aparecerá en Informes.
            </p>
            <form onSubmit={(e) => void submitEntry(e)}>
              <label className="admin__field">
                Tipo
                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category: e.target.value as FinanceCategory,
                    }))
                  }
                >
                  {EXPENSE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin__field">
                Monto (S/)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="admin__field">
                Detalle (opcional)
                <input
                  value={form.label}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="Ej. Hosting Render, anuncio Meta…"
                />
              </label>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
                <button
                  type="submit"
                  className="admin__btn admin__btn--primary"
                  disabled={submitting}
                >
                  {submitting ? "Guardando…" : "Registrar"}
                </button>
                <button
                  type="button"
                  className="admin__btn"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
