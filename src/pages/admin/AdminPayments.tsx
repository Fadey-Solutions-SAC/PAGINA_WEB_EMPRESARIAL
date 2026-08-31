import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../lib/api";

export type AdminPayment = {
  id: string;
  clientName: string;
  period: string;
  amount: number | null;
  receiptPath: string;
  source: string;
  status: "pending" | "approved" | "rejected";
  receivedAt: string;
  reviewedAt?: string | null;
  user: { id: string; username: string; clientName?: string; licenseKey?: string };
};

type PayTab = "approved" | "pending";

function money(value: number | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "S/ —";
  return `S/ ${n.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function paymentWhen(p: AdminPayment) {
  return p.reviewedAt || p.receivedAt;
}

function isCurrentMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function buildMonthApprovalChart(payments: AdminPayment[]) {
  const byDay = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== "approved") continue;
    if (!isCurrentMonth(paymentWhen(p))) continue;
    const key = paymentWhen(p).slice(0, 10);
    byDay.set(key, round2((byDay.get(key) || 0) + (Number(p.amount) || 0)));
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  let running = 0;
  const chart: { date: string; total: number }[] = [];
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    running = round2(running + (byDay.get(key) || 0));
    chart.push({ date: key, total: running });
  }
  return chart;
}

function ApprovalChart({ data }: { data: { date: string; total: number }[] }) {
  const points = useMemo(() => {
    if (!data.length) return "";
    const values = data.map((d) => d.total);
    const lo = Math.min(0, ...values);
    const hi = Math.max(...values, 1);
    const pad = (hi - lo) * 0.1 || 1;
    const minV = lo - pad;
    const maxV = hi + pad;
    const w = 220;
    const h = 72;
    return data
      .map((d, i) => {
        const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
        const y = h - ((d.total - minV) / (maxV - minV)) * h;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  const monthTotal = data[data.length - 1]?.total ?? 0;

  return (
    <div className="pay-chart">
      <div className="pay-chart__meta">
        <span>Aprobado del mes</span>
        <strong>{money(monthTotal)}</strong>
      </div>
      <svg viewBox="0 0 220 72" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="36" x2="220" y2="36" className="pay-chart__axis" />
        {points && (
          <polyline points={points} className="pay-chart__line" fill="none" />
        )}
      </svg>
    </div>
  );
}

type Props = {
  payments: AdminPayment[];
  loading: boolean;
  searchQuery: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onNotifyPos: (id: string) => void;
  onLightbox: (url: string) => void;
};

export function AdminPayments({
  payments,
  loading,
  searchQuery,
  onApprove,
  onReject,
  onNotifyPos,
  onLightbox,
}: Props) {
  const [tab, setTab] = useState<PayTab>("approved");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const q = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.clientName.toLowerCase().includes(q) ||
        p.period.toLowerCase().includes(q) ||
        p.user.username.toLowerCase().includes(q) ||
        (p.user.licenseKey || p.user.id).toLowerCase().includes(q),
    );
  }, [payments, q]);

  const chart = useMemo(() => buildMonthApprovalChart(filtered), [filtered]);

  const clients = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of filtered) {
      if (p.status !== "approved" && p.status !== "pending") continue;
      const id = p.user.id;
      const prev = map.get(id);
      if (prev) {
        prev.count += 1;
      } else {
        map.set(id, { id, name: p.clientName, count: 1 });
      }
    }
    return Array.from(map.values())
      .filter((c) =>
        filtered.some((p) => p.user.id === c.id && p.status === "approved"),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [filtered]);

  useEffect(() => {
    if (!clients.length) {
      setSelectedClientId("");
      return;
    }
    if (!selectedClientId || !clients.some((c) => c.id === selectedClientId)) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const clientPayments = useMemo(() => {
    if (!selectedClientId) return [];
    return filtered
      .filter((p) => p.user.id === selectedClientId)
      .filter((p) => p.status === "approved" || p.status === "pending")
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return paymentWhen(b).localeCompare(paymentWhen(a));
      });
  }, [filtered, selectedClientId]);

  const pendingList = useMemo(
    () =>
      filtered
        .filter((p) => p.status === "pending")
        .sort((a, b) => paymentWhen(b).localeCompare(paymentWhen(a))),
    [filtered],
  );

  const pendingCount = pendingList.length;

  return (
    <div className="pay-workspace">
      <div className="pay-workspace__head">
        <div className="pay-tabs" role="tablist" aria-label="Estado de pagos">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "approved"}
            className={tab === "approved" ? "is-active" : ""}
            onClick={() => setTab("approved")}
          >
            Aprobados
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "pending"}
            className={tab === "pending" ? "is-active" : ""}
            onClick={() => setTab("pending")}
          >
            Pendientes
            {pendingCount > 0 && (
              <span className="pay-tabs__count">{pendingCount}</span>
            )}
          </button>
        </div>
        {!loading && <ApprovalChart data={chart} />}
      </div>

      {loading ? (
        <div className="admin__skeleton pay-workspace__loader" />
      ) : tab === "approved" ? (
        <div className="pay-split">
          <aside className="pay-clients admin__card">
            <div className="admin__card-head">
              <h2>Clientes</h2>
            </div>
            <div className="admin__card-body pay-clients__list">
              {clients.length === 0 ? (
                <div className="admin__empty">
                  <strong>Sin clientes con pagos aprobados</strong>
                </div>
              ) : (
                clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`pay-client ${selectedClientId === c.id ? "is-active" : ""}`}
                    onClick={() => setSelectedClientId(c.id)}
                  >
                    <span>{c.name}</span>
                    <em>{c.count}</em>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="pay-detail admin__card">
            <div className="admin__card-head">
              <h2>
                {clients.find((c) => c.id === selectedClientId)?.name ||
                  "Pagos del cliente"}
              </h2>
            </div>
            <div className="admin__card-body">
              {!selectedClientId || clientPayments.length === 0 ? (
                <div className="admin__empty">
                  <strong>Sin pagos para mostrar</strong>
                  Selecciona un cliente o aprueba comprobantes pendientes.
                </div>
              ) : (
                <div className="pay-detail__grid">
                  {clientPayments.map((p) => (
                    <article
                      key={p.id}
                      className={`admin__pay-card ${p.status === "pending" ? "is-pending-first" : ""}`}
                    >
                      <img
                        src={apiUrl(p.receiptPath)}
                        alt={`Comprobante ${p.period}`}
                        onClick={() => onLightbox(apiUrl(p.receiptPath))}
                      />
                      <div className="meta">
                        <strong>{money(p.amount)}</strong>
                        <div>{p.period}</div>
                        <div style={{ color: "#8fa6b8", fontSize: "0.78rem" }}>
                          {new Date(paymentWhen(p)).toLocaleDateString("es-PE")}
                        </div>
                        <span
                          className={`admin__badge ${
                            p.status === "approved"
                              ? "admin__badge--ok"
                              : "admin__badge--warn"
                          }`}
                        >
                          {p.status === "approved" ? "Aprobado" : "Pendiente"}
                        </span>
                        {p.status === "pending" && (
                          <div className="pay-card__actions">
                            <button
                              type="button"
                              className="admin__btn admin__btn--primary"
                              onClick={() => onApprove(p.id)}
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className="admin__btn admin__btn--danger"
                              onClick={() => onReject(p.id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                        {p.status === "approved" && (
                          <button
                            type="button"
                            className="admin__btn admin__btn--ghost"
                            onClick={() => onNotifyPos(p.id)}
                          >
                            Confirmar al POS
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="pay-pending-wrap admin__card">
          <div className="admin__card-head">
            <h2>Pagos pendientes</h2>
          </div>
          <div className="admin__card-body">
            {pendingList.length === 0 ? (
              <div className="admin__empty">
                <strong>No hay pagos pendientes</strong>
              </div>
            ) : (
              <div className="pay-pending-grid">
                {pendingList.map((p) => (
                  <article key={p.id} className="pay-pending-card">
                    <div>
                      <strong>{p.clientName}</strong>
                      <div className="pay-pending-card__amount">{money(p.amount)}</div>
                      <div style={{ color: "#8fa6b8", fontSize: "0.78rem" }}>
                        {p.period} · {new Date(paymentWhen(p)).toLocaleDateString("es-PE")}
                      </div>
                    </div>
                    <div className="pay-pending-card__actions">
                      <button
                        type="button"
                        className="admin__btn admin__btn--primary"
                        onClick={() => onApprove(p.id)}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className="admin__btn admin__btn--ghost"
                        onClick={() => onLightbox(apiUrl(p.receiptPath))}
                      >
                        Ver
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
