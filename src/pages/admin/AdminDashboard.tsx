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

function ProfitChart({ data }: { data: FinanceDashboard["chart"] }) {
  const { points } = useMemo(() => {
    if (!data.length) {
      return { points: "" };
    }
    const values = data.map((d) => d.ganancias);
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values, 1);
    const pad = (hi - lo) * 0.12 || 1;
    const minV = lo - pad;
    const maxV = hi + pad;
    const w = 280;
    const h = 120;
    const pts = data
      .map((d, i) => {
        const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
        const y = h - ((d.ganancias - minV) / (maxV - minV)) * h;
        return `${x},${y}`;
      })
      .join(" ");
    return { points: pts };
  }, [data]);

  return (
    <div className="dash-chart">
      <svg viewBox="0 0 280 120" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="60" x2="280" y2="60" className="dash-chart__axis" />
        {points && (
          <>
            <polyline points={points} className="dash-chart__line" fill="none" />
            <polygon
              points={`0,120 ${points} 280,120`}
              className="dash-chart__fill"
            />
          </>
        )}
      </svg>
      <div className="dash-chart__foot">
        <span>{data[0]?.date.slice(8) || "1"}</span>
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
    { key: "mes", label: "Mes", value: data?.mes ?? 0, tone: "income" },
    { key: "personal", label: "Personal", value: data?.personal ?? 0, tone: "expense" },
    {
      key: "servidores",
      label: "Servidores",
      value: data?.servidores ?? 0,
      tone: "expense",
    },
    {
      key: "publicidad",
      label: "Publicidad",
      value: data?.publicidad ?? 0,
      tone: "expense",
    },
    { key: "equipos", label: "Equipos", value: data?.equipos ?? 0, tone: "expense" },
    {
      key: "impuestos",
      label: "Impuestos",
      value: data?.impuestos ?? 0,
      tone: "expense",
    },
  ] as const;

  return (
    <div className="dash">
      <div className="dash__top">
        <div className="dash__cards">
          {cards.map((card) => (
            <article
              key={card.key}
              className={`dash-card dash-card--${card.tone}`}
            >
              <span>{card.label}</span>
              <strong>{loading ? "—" : money(card.value)}</strong>
            </article>
          ))}
        </div>

        <aside className="dash__profit">
          <div className="dash__profit-head">
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
          <div>
            <h2>Informes</h2>
            <p className="dash__reports-sub">
              Movimientos del mes {data?.month || ""}
            </p>
          </div>
          <button
            type="button"
            className="admin__btn admin__btn--primary"
            onClick={() => setModalOpen(true)}
          >
            Nuevo informe
          </button>
        </div>
        <div className="admin__card-body">
          {loading ? (
            <div className="admin__skeleton" style={{ height: 160 }} />
          ) : !data?.entries.length ? (
            <div className="admin__empty">
              <strong>Sin movimientos</strong>
              Los pagos aprobados suman en Mes. Registra gastos con Nuevo informe.
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
