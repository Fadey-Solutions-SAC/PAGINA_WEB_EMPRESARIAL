import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type Product } from "../../lib/auth";

type ClientRow = {
  id: string;
  username: string;
  clientName: string;
  products: Product[];
  active: boolean;
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
  onError: (msg: string) => void;
  search: string;
};

export function AdminClientView({ token, clients, onError, search }: Props) {
  const navigate = useNavigate();
  const { enterAsClient } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  async function openClient(id: string) {
    if (!token || loadingId) return;
    setLoadingId(id);
    try {
      await enterAsClient(id, token);
      navigate("/academia");
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo abrir la vista");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="admin__card client-view-list">
      <div className="admin__card-head">
        <div>
          <h2>Vista de cliente</h2>
          <p className="client-view-list__sub">
            Elige un cliente para entrar a su portal real de academia, como si fueras
            él.
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
                  disabled={loadingId === c.id}
                  onClick={() => void openClient(c.id)}
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
                  <span className="client-view-list__enter">
                    {loadingId === c.id ? "Abriendo…" : "Entrar al portal →"}
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
