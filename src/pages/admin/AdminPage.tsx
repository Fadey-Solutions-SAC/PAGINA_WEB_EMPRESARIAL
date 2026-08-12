import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiUrl } from "../../lib/api";
import { useAuth, type Product } from "../../lib/auth";
import { useTheme, type SiteTheme } from "../../lib/theme";
import "./Admin.css";

type Section = "resumen" | "leads" | "users" | "payments" | "courses";

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
  webServiceUrl?: string | null;
  licenseKey?: string;
  restaurantData?: Record<string, unknown> | null;
  _count: { payments: number };
};

type Payment = {
  id: string;
  clientName: string;
  period: string;
  amount: number | null;
  receiptPath: string;
  source: string;
  status: "pending" | "approved" | "rejected";
  receivedAt: string;
  user: { id: string; username: string; clientName?: string; licenseKey?: string };
};

type Course = {
  id: string;
  product: Product;
  kind: "tutorial" | "academia";
  title: string;
  youtubeUrl: string;
  embedUrl?: string;
};

type Stats = {
  leadsWeek: number;
  usersActive: number;
  paymentsMonth: number;
  courses: number;
  leadsTotal: number;
  usersTotal: number;
  unlinkedLeads: number;
};

const PRODUCT_LABEL: Record<Product, string> = {
  resto: "Resto Fadey",
  erp: "ERP Fadey",
  web: "Desarrollo web",
  soporte: "Soporte",
};

const ALL_PRODUCTS: Product[] = ["resto", "erp", "web", "soporte"];

const NAV: { id: Section; label: string; ico: string }[] = [
  { id: "resumen", label: "Resumen", ico: "◉" },
  { id: "leads", label: "Registros", ico: "▤" },
  { id: "users", label: "Usuarios", ico: "◎" },
  { id: "payments", label: "Pagos", ico: "▣" },
  { id: "courses", label: "Cursos", ico: "▶" },
];

function badgeClass(p: Product) {
  return `admin__badge admin__badge--${p}`;
}

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

export function AdminPage() {
  const { token, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<Section>("resumen");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  const pickSiteTheme = useCallback(
    async (next: SiteTheme) => {
      setTheme(next);
      try {
        await api("/api/theme", {
          method: "PUT",
          token,
          body: JSON.stringify({ theme: next }),
        });
        setToast("Color del sitio actualizado para todos los dispositivos");
      } catch (err) {
        setBanner(
          err instanceof Error
            ? err.message
            : "No se pudo guardar el color del sitio",
        );
      }
    },
    [setTheme, token],
  );

  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [leadFilter, setLeadFilter] = useState<"all" | Product | "unlinked">("all");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "off" | Product>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{
    id: string;
    username: string;
    password: string;
    licenseKey?: string;
    webServiceUrl?: string | null;
    clientName?: string;
  } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState<"webservice" | "manual">("webservice");
  const [wsUrl, setWsUrl] = useState("");
  const [wsProbing, setWsProbing] = useState(false);
  const [wsRestaurant, setWsRestaurant] = useState<{
    name: string;
    legalName?: string;
    email?: string;
    ruc?: string;
    phone?: string;
    address?: string;
  } | null>(null);
  const [payFilter, setPayFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "all",
  );

  const [linkForm, setLinkForm] = useState({
    leadId: "",
    clientName: "",
    products: ["resto"] as Product[],
  });

  const [payForm, setPayForm] = useState({
    userId: "",
    clientName: "",
    period: "",
    file: null as File | null,
  });

  const [courseForm, setCourseForm] = useState({
    product: "resto" as Product,
    kind: "tutorial" as "tutorial" | "academia",
    title: "",
    youtubeUrl: "",
  });

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setBanner("");
    try {
      const [l, u, p, c, s] = await Promise.all([
        api<Lead[]>("/api/leads", { token }),
        api<UserRow[]>("/api/users", { token }),
        api<Payment[]>("/api/payments", { token }),
        api<Course[]>("/api/courses", { token }),
        api<Stats>("/api/admin/stats", { token }).catch(() => null),
      ]);
      setLeads(l);
      setUsers(u);
      setPayments(p);
      setCourses(c);
      setStats(s);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar";
      setBanner(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (leadFilter === "unlinked" && l.linkedUser) return false;
      if (leadFilter !== "all" && leadFilter !== "unlinked" && l.intent !== leadFilter)
        return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company || "").toLowerCase().includes(q) ||
        (l.message || "").toLowerCase().includes(q)
      );
    });
  }, [leads, leadFilter, q]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userFilter === "active" && !u.active) return false;
      if (userFilter === "off" && u.active) return false;
      if (
        userFilter !== "all" &&
        userFilter !== "active" &&
        userFilter !== "off" &&
        !u.products.includes(userFilter)
      )
        return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.clientName.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.licenseKey || "").toLowerCase().includes(q) ||
        (u.webServiceUrl || "").toLowerCase().includes(q)
      );
    });
  }, [users, userFilter, q]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (payFilter !== "all" && p.status !== payFilter) return false;
      if (!q) return true;
      return (
        p.clientName.toLowerCase().includes(q) ||
        p.period.toLowerCase().includes(q) ||
        p.user.username.toLowerCase().includes(q) ||
        p.user.id.toLowerCase().includes(q)
      );
    });
  }, [payments, payFilter, q]);

  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status === "pending").length,
    [payments],
  );

  function openLink(from?: Lead) {
    if (from) {
      setLinkMode("manual");
      setLinkForm({
        leadId: from.id,
        clientName: from.name,
        products: [from.intent],
      });
    } else {
      setLinkMode("webservice");
      setLinkForm({ leadId: "", clientName: "", products: ["resto"] });
    }
    setWsUrl("");
    setWsRestaurant(null);
    setCreatedCreds(null);
    setLinkOpen(true);
    setSelectedLead(null);
  }

  async function probeWebService() {
    if (!token || !wsUrl.trim()) return;
    setWsProbing(true);
    setBanner("");
    try {
      const result = await api<{
        url: string;
        restaurant: {
          name: string;
          legalName?: string;
          email?: string;
          ruc?: string;
          phone?: string;
          address?: string;
        };
      }>("/api/users/probe-webservice", {
        method: "POST",
        token,
        body: JSON.stringify({ url: wsUrl.trim() }),
      });
      setWsUrl(result.url);
      setWsRestaurant(result.restaurant);
      setLinkForm((prev) => ({
        ...prev,
        clientName: result.restaurant.name,
        products: prev.products.length ? prev.products : ["resto"],
      }));
      showToast("Restaurante encontrado");
    } catch (err) {
      setWsRestaurant(null);
      setBanner(err instanceof Error ? err.message : "No se pudo consultar");
    } finally {
      setWsProbing(false);
    }
  }

  async function submitWebServiceLink(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBanner("");
    try {
      const result = await api<{
        id: string;
        username: string;
        password: string;
        licenseKey: string;
        webServiceUrl: string | null;
        clientName: string;
      }>("/api/users/link-webservice", {
        method: "POST",
        token,
        body: JSON.stringify({
          url: wsUrl.trim(),
          products: linkForm.products,
        }),
      });
      setCreatedCreds({
        id: result.id,
        username: result.username,
        password: result.password,
        licenseKey: result.licenseKey,
        webServiceUrl: result.webServiceUrl,
        clientName: result.clientName,
      });
      showToast("Licencia generada");
      await load();
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "No se pudo vincular");
    }
  }

  async function submitLink(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const result = await api<{
        id: string;
        username: string;
        password: string;
        licenseKey: string;
      }>("/api/users/link", {
        method: "POST",
        token,
        body: JSON.stringify(linkForm),
      });
      setCreatedCreds({
        id: result.id,
        username: result.username,
        password: result.password,
        licenseKey: result.licenseKey,
        clientName: linkForm.clientName,
      });
      showToast("Cliente vinculado");
      await load();
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "No se pudo vincular");
    }
  }

  async function setPaymentStatus(
    id: string,
    status: "approved" | "rejected" | "pending",
  ) {
    if (!token) return;
    try {
      await api(`/api/payments/${id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      showToast(
        status === "approved"
          ? "Pago aprobado"
          : status === "rejected"
            ? "Pago rechazado"
            : "Pago pendiente",
      );
      await load();
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "No se pudo actualizar el pago");
    }
  }

  async function toggleUser(u: UserRow) {
    if (!token) return;
    await api(`/api/users/${u.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ active: !u.active }),
    });
    showToast(u.active ? "Usuario desactivado" : "Usuario activado");
    await load();
  }

  async function resetPassword(u: UserRow) {
    if (!token) return;
    const result = await api<{ password: string; username: string }>(
      `/api/users/${u.id}/reset-password`,
      { method: "POST", token },
    );
    setCreatedCreds({
      id: u.id,
      username: result.username,
      password: result.password,
      licenseKey: u.licenseKey || u.id,
      clientName: u.clientName,
      webServiceUrl: u.webServiceUrl,
    });
    setLinkOpen(true);
    showToast("Contraseña regenerada");
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault();
    if (!token || !payForm.file) return;
    const fd = new FormData();
    fd.append("userId", payForm.userId);
    fd.append("clientName", payForm.clientName);
    fd.append("period", payForm.period);
    fd.append("receipt", payForm.file);
    await api("/api/payments", { method: "POST", token, body: fd });
    setPayForm({ userId: "", clientName: "", period: "", file: null });
    showToast("Pago registrado");
    await load();
    setSection("payments");
  }

  async function submitCourse(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
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
    showToast("Curso agregado");
    await load();
  }

  async function deleteCourse(id: string) {
    if (!token) return;
    if (!window.confirm("¿Eliminar este curso?")) return;
    await api(`/api/courses/${id}`, { method: "DELETE", token });
    showToast("Curso eliminado");
    await load();
  }

  const title =
    NAV.find((n) => n.id === section)?.label || "Panel admin";

  return (
    <div className="admin">
      <aside className={`admin__sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="admin__brand">
          <img src="/logo-fadey.png" alt="" width={40} height={40} />
          <div>
            <strong>Academia Fadey</strong>
            <span>Backoffice</span>
          </div>
        </div>
        <nav className="admin__nav" aria-label="Admin">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? "is-active" : ""}
              onClick={() => {
                setSection(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className="admin__nav-ico" aria-hidden="true">
                {item.ico}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin__theme" role="group" aria-label="Color del sitio">
          <span className="admin__theme-label">Color del sitio</span>
          <div className="admin__theme-options">
            <button
              type="button"
              className={`admin__theme-btn admin__theme-btn--blue ${theme === "blue" ? "is-active" : ""}`}
              aria-pressed={theme === "blue"}
              onClick={() => void pickSiteTheme("blue")}
            >
              <span className="admin__theme-swatch" aria-hidden="true" />
              Azul
            </button>
            <button
              type="button"
              className={`admin__theme-btn admin__theme-btn--emerald ${theme === "emerald" ? "is-active" : ""}`}
              aria-pressed={theme === "emerald"}
              onClick={() => void pickSiteTheme("emerald")}
            >
              <span className="admin__theme-swatch" aria-hidden="true" />
              Verde
            </button>
          </div>
        </div>
        <div className="admin__side-foot">
          <Link to="/">← Ir al sitio</Link>
          <button type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="admin__main">
        <header className="admin__topbar">
          <div>
            <button
              type="button"
              className="admin__btn admin__menu-btn"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              Menú
            </button>
            <h1>{title}</h1>
            <p>Gestión Fadey · clientes, pagos y academia</p>
          </div>
          <div className="admin__top-actions">
            <input
              className="admin__search"
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="admin__chip">Admin</span>
            <button type="button" className="admin__btn" onClick={() => void load()}>
              Actualizar
            </button>
          </div>
        </header>

        <div className="admin__content">
          {banner && (
            <div className="admin__banner admin__banner--error" role="alert">
              {banner}
              <div style={{ marginTop: "0.55rem" }}>
                Si menciona base de datos: en Render agrega{" "}
                <strong>DATABASE_URL</strong> (Internal Database URL de Postgres) y
                redespliega.
              </div>
            </div>
          )}

          {section === "resumen" && (
            <>
              <div className="admin__kpis">
                <div className="admin__kpi">
                  <span>Registros (7 días)</span>
                  <strong>{loading ? "—" : stats?.leadsWeek ?? leads.length}</strong>
                  <em>{stats?.unlinkedLeads ?? 0} sin vincular</em>
                </div>
                <div className="admin__kpi">
                  <span>Usuarios activos</span>
                  <strong>{loading ? "—" : stats?.usersActive ?? 0}</strong>
                  <em>{stats?.usersTotal ?? users.length} totales</em>
                </div>
                <div className="admin__kpi">
                  <span>Pagos del mes</span>
                  <strong>{loading ? "—" : stats?.paymentsMonth ?? 0}</strong>
                  <em>{pendingPayments} pendientes de aprobar</em>
                </div>
                <div className="admin__kpi">
                  <span>Cursos</span>
                  <strong>{loading ? "—" : stats?.courses ?? courses.length}</strong>
                  <em>Tutoriales + academia</em>
                </div>
              </div>
              <div className="admin__quick">
                <button
                  type="button"
                  className="admin__btn admin__btn--primary"
                  onClick={() => {
                    setSection("users");
                    openLink();
                  }}
                >
                  Vincular web service
                </button>
                <button
                  type="button"
                  className="admin__btn"
                  onClick={() => setSection("payments")}
                >
                  Subir comprobante
                </button>
                <button
                  type="button"
                  className="admin__btn"
                  onClick={() => setSection("courses")}
                >
                  Agregar video
                </button>
                <button
                  type="button"
                  className="admin__btn"
                  onClick={() => setSection("leads")}
                >
                  Ver registros
                </button>
              </div>
            </>
          )}

          {section === "leads" && (
            <div className="admin__card">
              <div className="admin__card-head">
                <h2>Registros del formulario de contacto</h2>
              </div>
              <div className="admin__card-body">
                <div className="admin__filters">
                  <select
                    value={leadFilter}
                    onChange={(e) =>
                      setLeadFilter(e.target.value as typeof leadFilter)
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="unlinked">Sin vincular</option>
                    {ALL_PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {PRODUCT_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </div>
                {loading ? (
                  <div className="admin__skeleton" style={{ height: 120 }} />
                ) : filteredLeads.length === 0 ? (
                  <div className="admin__empty">
                    <strong>Aún no hay registros</strong>
                    Cuando alguien complete el formulario de contacto de la web,
                    aparecerán aquí con nombre, correo, interés y mensaje.
                  </div>
                ) : (
                  <div className="admin__table-wrap">
                    <table className="admin__table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Interés</th>
                          <th>Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((l) => (
                          <tr key={l.id}>
                            <td>{new Date(l.createdAt).toLocaleString()}</td>
                            <td>
                              <strong>{l.name}</strong>
                              {l.company ? (
                                <div style={{ color: "#8fa6b8" }}>{l.company}</div>
                              ) : null}
                            </td>
                            <td>{l.email}</td>
                            <td>
                              <span className={badgeClass(l.intent)}>
                                {PRODUCT_LABEL[l.intent]}
                              </span>
                            </td>
                            <td>
                              {l.linkedUser ? (
                                <span className="admin__badge admin__badge--ok">
                                  {l.linkedUser.username}
                                </span>
                              ) : (
                                <span className="admin__badge admin__badge--warn">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="linkish"
                                onClick={() => setSelectedLead(l)}
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
          )}

          {section === "users" && (
            <div className="admin__card">
              <div className="admin__card-head">
                <h2>Usuarios del sistema</h2>
                <button
                  type="button"
                  className="admin__btn admin__btn--primary"
                  onClick={() => openLink()}
                >
                  Vincular web service
                </button>
              </div>
              <div className="admin__card-body">
                <div className="admin__filters">
                  <select
                    value={userFilter}
                    onChange={(e) =>
                      setUserFilter(e.target.value as typeof userFilter)
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="off">Inactivos</option>
                    {ALL_PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {PRODUCT_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </div>
                {filteredUsers.length === 0 ? (
                  <div className="admin__empty">
                    <strong>Sin usuarios</strong>
                    Coloca la URL del web service del cliente para generar licencia y acceso.
                  </div>
                ) : (
                  <div className="admin__table-wrap">
                    <table className="admin__table">
                      <thead>
                        <tr>
                          <th>ID / licencia</th>
                          <th>Usuario</th>
                          <th>Cliente</th>
                          <th>Web service</th>
                          <th>Productos</th>
                          <th>Pagos</th>
                          <th>Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <button
                                type="button"
                                className="linkish"
                                onClick={() => {
                                  void copyText(u.licenseKey || u.id);
                                  showToast("ID de cliente copiado");
                                }}
                              >
                                {(u.licenseKey || u.id).slice(0, 8)}…
                              </button>
                            </td>
                            <td>{u.username}</td>
                            <td>{u.clientName}</td>
                            <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {u.webServiceUrl ? (
                                <a
                                  href={u.webServiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#7debff", fontSize: "0.8rem" }}
                                >
                                  {u.webServiceUrl.replace(/^https?:\/\//, "")}
                                </a>
                              ) : (
                                <span style={{ color: "#8fa6b8" }}>—</span>
                              )}
                            </td>
                            <td>
                              {u.products.map((p) => (
                                <span
                                  key={p}
                                  className={badgeClass(p)}
                                  style={{ marginRight: 4 }}
                                >
                                  {PRODUCT_LABEL[p]}
                                </span>
                              ))}
                            </td>
                            <td>{u._count.payments}</td>
                            <td>
                              <span
                                className={`admin__badge ${u.active ? "admin__badge--ok" : "admin__badge--off"}`}
                              >
                                {u.active ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              <button
                                type="button"
                                className="admin__btn admin__btn--ghost"
                                onClick={() => void toggleUser(u)}
                              >
                                {u.active ? "Off" : "On"}
                              </button>{" "}
                              <button
                                type="button"
                                className="admin__btn"
                                onClick={() => void resetPassword(u)}
                              >
                                Reset pass
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
          )}

          {section === "payments" && (
            <div className="admin__grid-2">
              <div className="admin__card">
                <div className="admin__card-head">
                  <h2>Comprobantes PNG</h2>
                  {pendingPayments > 0 && (
                    <span className="admin__badge admin__badge--warn">
                      {pendingPayments} por aprobar
                    </span>
                  )}
                </div>
                <div className="admin__card-body">
                  <div className="admin__filters">
                    <select
                      value={payFilter}
                      onChange={(e) =>
                        setPayFilter(e.target.value as typeof payFilter)
                      }
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendientes</option>
                      <option value="approved">Aprobados</option>
                      <option value="rejected">Rechazados</option>
                    </select>
                  </div>
                  {filteredPayments.length === 0 ? (
                    <div className="admin__empty">
                      <strong>Sin pagos</strong>
                      Los web services envían PNG con el ID de cliente/licencia; aquí los apruebas.
                    </div>
                  ) : (
                    <div className="admin__pay-grid">
                      {filteredPayments.map((p) => (
                        <article key={p.id} className="admin__pay-card">
                          <img
                            src={apiUrl(p.receiptPath)}
                            alt={`Comprobante ${p.period}`}
                            onClick={() => setLightbox(apiUrl(p.receiptPath))}
                          />
                          <div className="meta">
                            <strong>{p.clientName}</strong>
                            <div>{p.period}</div>
                            <div style={{ color: "#8fa6b8", fontSize: "0.78rem" }}>
                              ID {(p.user.licenseKey || p.user.id).slice(0, 8)}… ·{" "}
                              {p.source} ·{" "}
                              {new Date(p.receivedAt).toLocaleDateString()}
                            </div>
                            <div style={{ marginTop: "0.45rem" }}>
                              <span
                                className={`admin__badge ${
                                  p.status === "approved"
                                    ? "admin__badge--ok"
                                    : p.status === "rejected"
                                      ? "admin__badge--off"
                                      : "admin__badge--warn"
                                }`}
                              >
                                {p.status === "approved"
                                  ? "Aprobado"
                                  : p.status === "rejected"
                                    ? "Rechazado"
                                    : "Pendiente"}
                              </span>
                            </div>
                            {p.status === "pending" && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.35rem",
                                  marginTop: "0.55rem",
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  type="button"
                                  className="admin__btn admin__btn--primary"
                                  onClick={() => void setPaymentStatus(p.id, "approved")}
                                >
                                  Aprobar
                                </button>
                                <button
                                  type="button"
                                  className="admin__btn admin__btn--danger"
                                  onClick={() => void setPaymentStatus(p.id, "rejected")}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="admin__card">
                <div className="admin__card-head">
                  <h2>Registrar pago manual</h2>
                </div>
                <div className="admin__card-body">
                  <form onSubmit={(e) => void submitPayment(e)}>
                    <label className="admin__field">
                      Usuario
                      <select
                        required
                        value={payForm.userId}
                        onChange={(e) => {
                          const u = users.find((x) => x.id === e.target.value);
                          setPayForm((prev) => ({
                            ...prev,
                            userId: e.target.value,
                            clientName: u?.clientName || prev.clientName,
                          }));
                        }}
                      >
                        <option value="">Seleccionar</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.clientName} ({u.username})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin__field">
                      Nombre en comprobante
                      <input
                        required
                        value={payForm.clientName}
                        onChange={(e) =>
                          setPayForm((prev) => ({
                            ...prev,
                            clientName: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="admin__field">
                      Periodo (ej. 2026-08)
                      <input
                        required
                        value={payForm.period}
                        onChange={(e) =>
                          setPayForm((prev) => ({ ...prev, period: e.target.value }))
                        }
                      />
                    </label>
                    <label className="admin__field">
                      Comprobante PNG
                      <input
                        required
                        type="file"
                        accept="image/png"
                        onChange={(e) =>
                          setPayForm((prev) => ({
                            ...prev,
                            file: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>
                    <button type="submit" className="admin__btn admin__btn--primary">
                      Guardar pago
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {section === "courses" && (
            <div className="admin__grid-2">
              <div className="admin__card">
                <div className="admin__card-head">
                  <h2>Biblioteca YouTube</h2>
                </div>
                <div className="admin__card-body">
                  {courses.length === 0 ? (
                    <div className="admin__empty">
                      <strong>Sin cursos</strong>
                      Agrega videos de tu canal para Tutoriales y Academia.
                    </div>
                  ) : (
                    <div className="admin__course-grid">
                      {courses.map((c) => (
                        <article key={c.id} className="admin__course-card">
                          <span className={badgeClass(c.product)}>
                            {PRODUCT_LABEL[c.product]}
                          </span>{" "}
                          <span className="admin__badge admin__badge--warn">
                            {c.kind}
                          </span>
                          <h4>{c.title}</h4>
                          <a
                            href={c.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#7debff", fontSize: "0.85rem" }}
                          >
                            Abrir en YouTube
                          </a>
                          <div style={{ marginTop: "0.65rem" }}>
                            <button
                              type="button"
                              className="admin__btn admin__btn--danger"
                              onClick={() => void deleteCourse(c.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="admin__card">
                <div className="admin__card-head">
                  <h2>Agregar video</h2>
                </div>
                <div className="admin__card-body">
                  <form onSubmit={(e) => void submitCourse(e)}>
                    <label className="admin__field">
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
                    <label className="admin__field">
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
                    <label className="admin__field">
                      Título
                      <input
                        required
                        value={courseForm.title}
                        onChange={(e) =>
                          setCourseForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="admin__field">
                      URL YouTube
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
                    <button type="submit" className="admin__btn admin__btn--primary">
                      Publicar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLead && (
        <div
          className="admin__drawer-backdrop"
          onClick={() => setSelectedLead(null)}
          role="presentation"
        >
          <aside
            className="admin__drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Detalle registro"
          >
            <h3>{selectedLead.name}</h3>
            <p style={{ color: "#8fa6b8", marginTop: 0 }}>
              {selectedLead.email}
              {selectedLead.company ? ` · ${selectedLead.company}` : ""}
            </p>
            <span className={badgeClass(selectedLead.intent)}>
              {PRODUCT_LABEL[selectedLead.intent]}
            </span>
            <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
              {selectedLead.message || "Sin mensaje"}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
              {!selectedLead.linkedUser && (
                <button
                  type="button"
                  className="admin__btn admin__btn--primary"
                  onClick={() => openLink(selectedLead)}
                >
                  Crear acceso Academia
                </button>
              )}
              <button
                type="button"
                className="admin__btn"
                onClick={() => setSelectedLead(null)}
              >
                Cerrar
              </button>
            </div>
          </aside>
        </div>
      )}

      {linkOpen && (
        <div className="admin__modal-backdrop" role="presentation">
          <div className="admin__modal" role="dialog" aria-label="Vincular cliente">
            {createdCreds ? (
              <>
                <h3>Licencia y acceso generados</h3>
                <p style={{ color: "#8fa6b8" }}>
                  Guarda estos datos ahora. La contraseña no se vuelve a mostrar.
                  El ID de cliente controla los pagos del web service.
                </p>
                {createdCreds.clientName && (
                  <p style={{ marginTop: 0 }}>
                    Cliente: <strong>{createdCreds.clientName}</strong>
                  </p>
                )}
                <div className="admin__creds">
                  <div>
                    ID cliente / licencia:{" "}
                    <code>{createdCreds.licenseKey || createdCreds.id}</code>{" "}
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => {
                        void copyText(createdCreds.licenseKey || createdCreds.id);
                        showToast("Copiado");
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                  <div>
                    usuario: <code>{createdCreds.username}</code>{" "}
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => {
                        void copyText(createdCreds.username);
                        showToast("Copiado");
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                  <div>
                    contraseña: <code>{createdCreds.password}</code>{" "}
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => {
                        void copyText(createdCreds.password);
                        showToast("Copiado");
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                  {createdCreds.webServiceUrl && (
                    <div>
                      web service: <code>{createdCreds.webServiceUrl}</code>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="admin__btn admin__btn--primary"
                  onClick={() => {
                    setLinkOpen(false);
                    setCreatedCreds(null);
                  }}
                >
                  Listo
                </button>
              </>
            ) : (
              <>
                <h3>Vincular cliente</h3>
                <div className="admin__tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    className={linkMode === "webservice" ? "is-active" : ""}
                    aria-selected={linkMode === "webservice"}
                    onClick={() => setLinkMode("webservice")}
                  >
                    Por web service
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={linkMode === "manual" ? "is-active" : ""}
                    aria-selected={linkMode === "manual"}
                    onClick={() => setLinkMode("manual")}
                  >
                    Manual / registro
                  </button>
                </div>

                {linkMode === "webservice" ? (
                  <form onSubmit={(e) => void submitWebServiceLink(e)}>
                    <label className="admin__field">
                      URL del web service
                      <input
                        required
                        type="url"
                        placeholder="https://tu-cliente.onrender.com"
                        value={wsUrl}
                        onChange={(e) => {
                          setWsUrl(e.target.value);
                          setWsRestaurant(null);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="admin__btn"
                      disabled={wsProbing || !wsUrl.trim()}
                      onClick={() => void probeWebService()}
                    >
                      {wsProbing ? "Consultando…" : "Consultar restaurante"}
                    </button>

                    {wsRestaurant && (
                      <div className="admin__ws-preview">
                        <strong>{wsRestaurant.name}</strong>
                        {wsRestaurant.ruc && <div>RUC: {wsRestaurant.ruc}</div>}
                        {wsRestaurant.email && <div>{wsRestaurant.email}</div>}
                        {wsRestaurant.phone && <div>{wsRestaurant.phone}</div>}
                        {wsRestaurant.address && <div>{wsRestaurant.address}</div>}
                      </div>
                    )}

                    <div className="admin__field" style={{ marginTop: "0.85rem" }}>
                      Productos
                      <div className="admin__checks">
                        {ALL_PRODUCTS.map((p) => {
                          const on = linkForm.products.includes(p);
                          return (
                            <label key={p} className={on ? "is-on" : ""}>
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() =>
                                  setLinkForm((prev) => ({
                                    ...prev,
                                    products: on
                                      ? prev.products.filter((x) => x !== p)
                                      : [...prev.products, p],
                                  }))
                                }
                              />
                              {PRODUCT_LABEL[p]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button
                        type="submit"
                        className="admin__btn admin__btn--primary"
                        disabled={!wsUrl.trim()}
                      >
                        Generar licencia y acceso
                      </button>
                      <button
                        type="button"
                        className="admin__btn"
                        onClick={() => setLinkOpen(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                    <p style={{ color: "#8fa6b8", fontSize: "0.82rem", marginBottom: 0 }}>
                      El sistema consulta{" "}
                      <code>/api/fadey/restaurant</code> en esa URL, crea usuario /
                      contraseña y un ID de cliente para controlar pagos.
                    </p>
                  </form>
                ) : (
                  <form onSubmit={(e) => void submitLink(e)}>
                    <label className="admin__field">
                      Desde registro (opcional)
                      <select
                        value={linkForm.leadId}
                        onChange={(e) => {
                          const lead = leads.find((x) => x.id === e.target.value);
                          setLinkForm((prev) => ({
                            ...prev,
                            leadId: e.target.value,
                            clientName: lead?.name || prev.clientName,
                            products: lead ? [lead.intent] : prev.products,
                          }));
                        }}
                      >
                        <option value="">Manual</option>
                        {leads
                          .filter((l) => !l.linkedUser)
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} · {PRODUCT_LABEL[l.intent]}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="admin__field">
                      Nombre del cliente
                      <input
                        required
                        value={linkForm.clientName}
                        onChange={(e) =>
                          setLinkForm((prev) => ({
                            ...prev,
                            clientName: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="admin__field">
                      Productos
                      <div className="admin__checks">
                        {ALL_PRODUCTS.map((p) => {
                          const on = linkForm.products.includes(p);
                          return (
                            <label key={p} className={on ? "is-on" : ""}>
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() =>
                                  setLinkForm((prev) => ({
                                    ...prev,
                                    products: on
                                      ? prev.products.filter((x) => x !== p)
                                      : [...prev.products, p],
                                  }))
                                }
                              />
                              {PRODUCT_LABEL[p]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="submit"
                        className="admin__btn admin__btn--primary"
                      >
                        Generar acceso
                      </button>
                      <button
                        type="button"
                        className="admin__btn"
                        onClick={() => setLinkOpen(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="admin__lightbox"
          onClick={() => setLightbox(null)}
          role="presentation"
        >
          <img src={lightbox} alt="Comprobante" />
        </div>
      )}

      {toast && <div className="admin__toast">{toast}</div>}
    </div>
  );
}
