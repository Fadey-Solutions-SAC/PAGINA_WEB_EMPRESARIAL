import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiUrl } from "../lib/api";
import { useAuth, type Product } from "../lib/auth";
import "./Portal.css";

type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  intent: Product;
  message: string | null;
  createdAt: string;
  linkedUser: { id: string; username: string } | null;
};

type UserRow = {
  id: string;
  username: string;
  clientName: string;
  products: Product[];
  active: boolean;
  createdAt: string;
  _count: { payments: number };
};

type Payment = {
  id: string;
  clientName: string;
  period: string;
  amount: number | null;
  receiptPath: string;
  source: string;
  receivedAt: string;
  user: { id: string; username: string };
};

type Course = {
  id: string;
  product: Product;
  kind: "tutorial" | "academia";
  title: string;
  youtubeUrl: string;
};

const PRODUCT_LABEL: Record<Product, string> = {
  resto: "Resto Fadey",
  erp: "ERP Fadey",
  web: "Desarrollo web",
  soporte: "Soporte",
};

const ALL_PRODUCTS: Product[] = ["resto", "erp", "web", "soporte"];

export function AdminPage() {
  const { token, logout, auth } = useAuth();
  const [tab, setTab] = useState<"leads" | "users" | "payments" | "courses">(
    "leads",
  );
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [createdCreds, setCreatedCreds] = useState<{
    id: string;
    username: string;
    password: string;
  } | null>(null);

  const [linkForm, setLinkForm] = useState({
    leadId: "",
    clientName: "",
    products: ["resto"] as Product[],
  });

  const [courseForm, setCourseForm] = useState({
    product: "resto" as Product,
    kind: "tutorial" as "tutorial" | "academia",
    title: "",
    youtubeUrl: "",
  });

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [l, u, p, c] = await Promise.all([
        api<Lead[]>("/api/leads", { token }),
        api<UserRow[]>("/api/users", { token }),
        api<Payment[]>("/api/payments", { token }),
        api<Course[]>("/api/courses", { token }),
      ]);
      setLeads(l);
      setUsers(u);
      setPayments(p);
      setCourses(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const unlinkedLeads = useMemo(
    () => leads.filter((l) => !l.linkedUser),
    [leads],
  );

  async function onLink(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const result = await api<{
        id: string;
        username: string;
        password: string;
      }>("/api/users/link", {
        method: "POST",
        token,
        body: JSON.stringify({
          leadId: linkForm.leadId || undefined,
          clientName: linkForm.clientName,
          products: linkForm.products,
        }),
      });
      setCreatedCreds(result);
      setLinkForm({ leadId: "", clientName: "", products: ["resto"] });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo vincular");
    }
  }

  async function onAddCourse(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await api("/api/courses", {
        method: "POST",
        token,
        body: JSON.stringify(courseForm),
      });
      setCourseForm({
        product: "resto",
        kind: "tutorial",
        title: "",
        youtubeUrl: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear curso");
    }
  }

  async function onDeleteCourse(id: string) {
    if (!token) return;
    await api(`/api/courses/${id}`, { method: "DELETE", token });
    await load();
  }

  function toggleProduct(p: Product) {
    setLinkForm((prev) => ({
      ...prev,
      products: prev.products.includes(p)
        ? prev.products.filter((x) => x !== p)
        : [...prev.products, p],
    }));
  }

  return (
    <div className="portal portal--wide">
      <header className="portal__top">
        <div>
          <h1>Panel admin</h1>
          <p>
            {auth.status === "ready" ? auth.name : "Admin"} · Gestión Fadey
          </p>
        </div>
        <div className="portal__top-actions">
          <Link to="/">Sitio</Link>
          <button type="button" className="btn btn--dark" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      {error && <p className="portal__error">{error}</p>}
      {createdCreds && (
        <div className="portal__notice">
          <strong>Usuario vinculado</strong>
          <p>
            user_id: <code>{createdCreds.id}</code>
          </p>
          <p>
            usuario: <code>{createdCreds.username}</code> · contraseña:{" "}
            <code>{createdCreds.password}</code>
          </p>
          <p>Guarda estos datos; la contraseña no se vuelve a mostrar.</p>
          <button type="button" onClick={() => setCreatedCreds(null)}>
            Cerrar
          </button>
        </div>
      )}

      <div className="portal__tabs">
        {(
          [
            ["leads", "Registros"],
            ["users", "Usuarios"],
            ["payments", "Pagos"],
            ["courses", "Cursos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "is-active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "leads" && (
        <section className="portal__section">
          <h2>Registros del formulario de contacto</h2>
          <div className="portal__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Interés</th>
                  <th>Vinculado</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.createdAt).toLocaleString()}</td>
                    <td>
                      {l.name}
                      {l.company ? ` · ${l.company}` : ""}
                    </td>
                    <td>{l.email}</td>
                    <td>{PRODUCT_LABEL[l.intent]}</td>
                    <td>
                      {l.linkedUser ? l.linkedUser.username : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Vincular cliente (genera usuario y contraseña)</h3>
          <form className="portal__form portal__form--grid" onSubmit={onLink}>
            <label>
              Desde registro (opcional)
              <select
                value={linkForm.leadId}
                onChange={(e) => {
                  const lead = unlinkedLeads.find((x) => x.id === e.target.value);
                  setLinkForm((prev) => ({
                    ...prev,
                    leadId: e.target.value,
                    clientName: lead?.name || prev.clientName,
                    products: lead ? [lead.intent] : prev.products,
                  }));
                }}
              >
                <option value="">Manual</option>
                {unlinkedLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {PRODUCT_LABEL[l.intent]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nombre del cliente
              <input
                required
                value={linkForm.clientName}
                onChange={(e) =>
                  setLinkForm((prev) => ({ ...prev, clientName: e.target.value }))
                }
              />
            </label>
            <fieldset>
              <legend>Productos</legend>
              {ALL_PRODUCTS.map((p) => (
                <label key={p} className="portal__check">
                  <input
                    type="checkbox"
                    checked={linkForm.products.includes(p)}
                    onChange={() => toggleProduct(p)}
                  />
                  {PRODUCT_LABEL[p]}
                </label>
              ))}
            </fieldset>
            <button className="btn btn--primary" type="submit">
              Generar acceso
            </button>
          </form>
        </section>
      )}

      {tab === "users" && (
        <section className="portal__section">
          <h2>Usuarios del sistema</h2>
          <div className="portal__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>user_id</th>
                  <th>Usuario</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Pagos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <code>{u.id}</code>
                    </td>
                    <td>{u.username}</td>
                    <td>{u.clientName}</td>
                    <td>{u.products.map((p) => PRODUCT_LABEL[p]).join(", ")}</td>
                    <td>{u._count.payments}</td>
                    <td>{u.active ? "Activo" : "Inactivo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "payments" && (
        <section className="portal__section">
          <h2>Comprobantes de pago (PNG)</h2>
          <div className="portal__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Periodo</th>
                  <th>Origen</th>
                  <th>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.receivedAt).toLocaleString()}</td>
                    <td>
                      {p.clientName} · {p.user.username}
                    </td>
                    <td>{p.period}</td>
                    <td>{p.source}</td>
                    <td>
                      <a
                        href={apiUrl(p.receiptPath)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver PNG
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "courses" && (
        <section className="portal__section">
          <h2>Tutoriales y Academia (YouTube)</h2>
          <form className="portal__form portal__form--grid" onSubmit={onAddCourse}>
            <label>
              Producto
              <select
                value={courseForm.product}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    product: e.target.value as Product,
                  }))
                }
              >
                {ALL_PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {PRODUCT_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select
                value={courseForm.kind}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    kind: e.target.value as "tutorial" | "academia",
                  }))
                }
              >
                <option value="tutorial">Tutorial</option>
                <option value="academia">Academia</option>
              </select>
            </label>
            <label>
              Título
              <input
                required
                value={courseForm.title}
                onChange={(e) =>
                  setCourseForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </label>
            <label>
              URL de YouTube
              <input
                required
                value={courseForm.youtubeUrl}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    youtubeUrl: e.target.value,
                  }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
            <button className="btn btn--primary" type="submit">
              Agregar video
            </button>
          </form>

          <div className="portal__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>{PRODUCT_LABEL[c.product]}</td>
                    <td>{c.kind}</td>
                    <td>{c.title}</td>
                    <td>
                      <button type="button" onClick={() => void onDeleteCourse(c.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
