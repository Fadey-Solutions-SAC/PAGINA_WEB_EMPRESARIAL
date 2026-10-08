import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type AiMessage = { id: string; at: string; text: string };
type AiUser = { userId: string; name: string; role: string; messages: AiMessage[] };
type AiCategory = { id: string; label: string; users: AiUser[] };

type Batch = {
  id: string;
  restaurantName: string;
  businessDay: string;
  purpose: string;
  test: boolean;
  messageCount: number;
  receivedAt: string;
  webServiceId: string;
  user: { clientName: string; username: string } | null;
  categories: AiCategory[];
};

type Props = {
  token: string | null;
  searchQuery: string;
  onError: (msg: string) => void;
};

export function AdminAiMessages({ token, searchQuery, onError }: Props) {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [openId, setOpenId] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    setLoading(true);
    api<{ batches: Batch[] }>("/api/ai-messages", { token })
      .then((data) => {
        if (!cancel) setBatches(Array.isArray(data.batches) ? data.batches : []);
      })
      .catch((err: unknown) => {
        if (!cancel) onError(err instanceof Error ? err.message : "No se pudieron leer los mensajes");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [token, onError]);

  async function removeBatch(id: string) {
    if (!token) return;
    if (!window.confirm("¿Eliminar este lote de mensajes de IA?")) return;
    setBusyId(id);
    try {
      await api(`/api/ai-messages/${encodeURIComponent(id)}`, { method: "DELETE", token });
      setBatches((prev) => prev.filter((batch) => batch.id !== id));
      if (openId === id) setOpenId("");
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setBusyId("");
    }
  }

  async function removeMessage(batch: Batch, categoryId: string, userId: string, messageId: string) {
    if (!token) return;
    if (!window.confirm("¿Eliminar este mensaje de IA?")) return;
    setBusyId(messageId || batch.id);
    try {
      const result = await api<{ deletedBatch?: boolean; messageCount?: number }>(
        `/api/ai-messages/${encodeURIComponent(batch.id)}/items`,
        {
          method: "DELETE",
          token,
          body: JSON.stringify({ categoryId, userId, messageId }),
        },
      );
      if (result.deletedBatch) {
        setBatches((prev) => prev.filter((row) => row.id !== batch.id));
        if (openId === batch.id) setOpenId("");
        return;
      }
      setBatches((prev) =>
        prev.map((row) => {
          if (row.id !== batch.id) return row;
          const categories = (row.categories || [])
            .map((cat) => {
              if (categoryId && cat.id !== categoryId) return cat;
              return {
                ...cat,
                users: cat.users
                  .map((user) => {
                    if (userId && user.userId !== userId) return user;
                    return {
                      ...user,
                      messages: user.messages.filter((msg) => msg.id !== messageId),
                    };
                  })
                  .filter((user) => user.messages.length > 0),
              };
            })
            .filter((cat) => cat.users.length > 0);
          return {
            ...row,
            categories,
            messageCount: result.messageCount ?? row.messageCount,
          };
        }),
      );
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "No se pudo eliminar el mensaje");
    } finally {
      setBusyId("");
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((batch) => {
      const blob = [
        batch.restaurantName,
        batch.businessDay,
        batch.webServiceId,
        batch.user?.clientName,
        ...(batch.categories || []).flatMap((cat) =>
          cat.users.flatMap((user) => [user.name, ...user.messages.map((m) => m.text)]),
        ),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [batches, searchQuery]);

  if (loading) {
    return <div className="admin__skeleton" style={{ height: 140 }} />;
  }

  return (
    <div className="admin__card">
      <div className="admin__card-head">
        <h2>Preguntas de IA recibidas de los restaurantes</h2>
      </div>
      <div className="admin__card-body">
        {filtered.length === 0 ? (
          <div className="admin__empty">
            <strong>Aún no llega ningún lote</strong>
            Cuando un Resto FADEY envíe las preguntas del día, quedarán aquí agrupadas por restaurante y usuario.
          </div>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Restaurante</th>
                  <th>Mensajes</th>
                  <th>Tipo</th>
                  <th>Recibido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((batch) => {
                  const open = openId === batch.id;
                  return (
                    <Fragment key={batch.id}>
                      <tr>
                        <td>{batch.businessDay}</td>
                        <td>
                          <strong>{batch.restaurantName || batch.user?.clientName || "Sin nombre"}</strong>
                        </td>
                        <td>{batch.messageCount}</td>
                        <td>{batch.test ? "Prueba" : "Cierre del día"}</td>
                        <td>{new Date(batch.receivedAt).toLocaleString("es-PE")}</td>
                        <td>
                          <button
                            type="button"
                            className="admin__btn admin__btn--ghost"
                            onClick={() => setOpenId(open ? "" : batch.id)}
                          >
                            {open ? "Ocultar" : "Ver"}
                          </button>{" "}
                          <button
                            type="button"
                            className="admin__btn admin__btn--danger"
                            disabled={busyId === batch.id}
                            onClick={() => void removeBatch(batch.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr>
                          <td colSpan={6}>
                            {(batch.categories || []).map((cat) => (
                              <div key={cat.id || cat.label} style={{ marginBottom: "0.8rem" }}>
                                <strong>{cat.label || cat.id}</strong>
                                {cat.users.map((user) => (
                                  <div key={user.userId || user.name} style={{ marginTop: "0.35rem" }}>
                                    <div>
                                      {user.name}
                                      {user.role ? ` · ${user.role}` : ""}
                                    </div>
                                    <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem" }}>
                                      {user.messages.map((msg) => (
                                        <li key={msg.id || `${msg.at}:${msg.text.slice(0, 24)}`}>
                                          {msg.text}{" "}
                                          <button
                                            type="button"
                                            className="admin__btn admin__btn--danger"
                                            style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem" }}
                                            disabled={busyId === msg.id}
                                            onClick={() => void removeMessage(batch, cat.id, user.userId, msg.id)}
                                          >
                                            Borrar
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
