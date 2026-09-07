import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type ClaimStatus = "pendiente" | "atendido" | "cerrado";
type ClaimKind = "reclamo" | "queja";
type ClaimGoods = "producto" | "servicio";

type Reclamacion = {
  id: string;
  folio: string;
  consumerName: string;
  documentType: string;
  documentNumber: string;
  address: string;
  phone: string;
  email: string;
  guardianName: string | null;
  goodsType: ClaimGoods;
  goodsDescription: string;
  claimedAmount: number | null;
  claimKind: ClaimKind;
  detail: string;
  request: string;
  status: ClaimStatus;
  createdAt: string;
};

type Props = {
  token: string | null;
  search: string;
  onError: (msg: string) => void;
  onToast: (msg: string) => void;
};

const STATUS_LABEL: Record<ClaimStatus, string> = {
  pendiente: "Pendiente",
  atendido: "Atendido",
  cerrado: "Cerrado",
};

export function AdminReclamaciones({
  token,
  search,
  onError,
  onToast,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Reclamacion[]>([]);
  const [selected, setSelected] = useState<Reclamacion | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ClaimStatus>("all");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api<Reclamacion[]>("/api/reclamaciones", { token });
      setRows(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudieron cargar reclamos");
    } finally {
      setLoading(false);
    }
  }, [onError, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.folio.toLowerCase().includes(q) ||
        r.consumerName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.documentNumber.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q)
      );
    });
  }, [q, rows, statusFilter]);

  async function setStatus(id: string, status: ClaimStatus) {
    if (!token) return;
    try {
      const updated = await api<Reclamacion>(`/api/reclamaciones/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSelected((prev) => (prev?.id === id ? updated : prev));
      onToast(`Marcado como ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  }

  return (
    <>
      <div className="admin__card">
        <div className="admin__card-head">
          <h2>Libro de reclamaciones</h2>
        </div>
        <div className="admin__card-body">
          <div className="admin__filters">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="all">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="atendido">Atendidos</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>
          {loading ? (
            <div className="admin__skeleton" style={{ height: 140 }} />
          ) : filtered.length === 0 ? (
            <div className="admin__empty">
              <strong>Sin reclamaciones</strong>
              Las hojas del libro digital aparecerán aquí cuando un usuario las
              envíe desde la web.
            </div>
          ) : (
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Folio</th>
                    <th>Consumidor</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td>
                        <code>{r.folio}</code>
                      </td>
                      <td>
                        <strong>{r.consumerName}</strong>
                        <div style={{ color: "#8fa6b8" }}>{r.email}</div>
                      </td>
                      <td>
                        <span
                          className={`admin__badge ${
                            r.claimKind === "reclamo"
                              ? "admin__badge--warn"
                              : "admin__badge--off"
                          }`}
                        >
                          {r.claimKind === "reclamo" ? "Reclamo" : "Queja"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin__badge ${
                            r.status === "pendiente"
                              ? "admin__badge--warn"
                              : r.status === "atendido"
                                ? "admin__badge--ok"
                                : "admin__badge--off"
                          }`}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => setSelected(r)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div
          className="admin__drawer-backdrop"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <aside
            className="admin__drawer"
            role="dialog"
            aria-label="Detalle de reclamación"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin__card-head">
              <h2>{selected.folio}</h2>
              <button
                type="button"
                className="admin__btn"
                onClick={() => setSelected(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="admin__card-body" style={{ display: "grid", gap: "0.75rem" }}>
              <p>
                <strong>{selected.consumerName}</strong>
                <br />
                {selected.documentType} {selected.documentNumber}
                <br />
                {selected.email} · {selected.phone}
                <br />
                {selected.address}
                {selected.guardianName ? (
                  <>
                    <br />
                    Tutor: {selected.guardianName}
                  </>
                ) : null}
              </p>
              <p>
                <strong>
                  {selected.goodsType === "producto" ? "Producto" : "Servicio"}
                </strong>
                {" · "}
                {selected.claimKind === "reclamo" ? "Reclamo" : "Queja"}
                {selected.claimedAmount != null
                  ? ` · S/ ${selected.claimedAmount.toFixed(2)}`
                  : ""}
                <br />
                {selected.goodsDescription}
              </p>
              <p>
                <strong>Detalle</strong>
                <br />
                {selected.detail}
              </p>
              <p>
                <strong>Pedido</strong>
                <br />
                {selected.request}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {(["pendiente", "atendido", "cerrado"] as ClaimStatus[]).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      className={`admin__btn ${
                        selected.status === s ? "admin__btn--primary" : ""
                      }`}
                      onClick={() => void setStatus(selected.id, s)}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ),
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
