import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api, apiUrl } from "../../lib/api";
import "./AdminCollaborators.css";

export type Collaborator = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  dni: string;
  personalPhone: string | null;
  photoUrl: string;
  position: string;
  area: string;
  hiredAt: string;
  employmentStatus: "active" | "inactive";
  corporateEmail: string | null;
  corporatePhone: string | null;
  issuedAt: string;
  expiresAt: string | null;
  credentialStatus: "vigente" | "inactiva" | "vencida";
  publicUrl: string;
  updatedAt: string;
};

type Audit = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  dni: string;
  personalPhone: string;
  photoPath: string;
  photoPreview: string;
  position: string;
  area: string;
  hiredAt: string;
  employmentStatus: "active" | "inactive";
  corporateEmail: string;
  corporatePhone: string;
  issuedAt: string;
  expiresAt: string;
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  dni: "",
  personalPhone: "",
  photoPath: "",
  photoPreview: "",
  position: "",
  area: "Administración",
  hiredAt: new Date().toISOString().slice(0, 10),
  employmentStatus: "active",
  corporateEmail: "",
  corporatePhone: "",
  issuedAt: new Date().toISOString().slice(0, 10),
  expiresAt: "",
};

const DEFAULT_AREAS = [
  "Administración",
  "Comercial",
  "Desarrollo",
  "Operaciones",
  "Soporte",
  "Gerencia",
];

type Props = {
  token: string | null;
  searchQuery: string;
  onError: (msg: string) => void;
  onToast: (msg: string) => void;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fromRow(row: Collaborator): FormState {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    dni: row.dni,
    personalPhone: row.personalPhone || "",
    photoPath: "",
    photoPreview: row.photoUrl,
    position: row.position,
    area: row.area,
    hiredAt: row.hiredAt,
    employmentStatus: row.employmentStatus,
    corporateEmail: row.corporateEmail || "",
    corporatePhone: row.corporatePhone || "",
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt || "",
  };
}

export function AdminCollaborators({ token, searchQuery, onError, onToast }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Collaborator[]>([]);
  const [areas, setAreas] = useState<string[]>(DEFAULT_AREAS);
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [preview, setPreview] = useState<Collaborator | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const qs = new URLSearchParams();
    if (searchQuery) qs.set("q", searchQuery);
    if (areaFilter) qs.set("area", areaFilter);
    if (statusFilter) qs.set("status", statusFilter);
    const data = await api<{ collaborators: Collaborator[] }>(
      `/api/collaborators${qs.toString() ? `?${qs}` : ""}`,
      { token },
    );
    setRows(Array.isArray(data.collaborators) ? data.collaborators : []);
  }, [token, searchQuery, areaFilter, statusFilter]);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    setLoading(true);
    Promise.all([
      load(),
      api<{ areas: string[] }>("/api/collaborators/areas", { token })
        .then((d) => {
          if (!cancel && Array.isArray(d.areas) && d.areas.length) setAreas(d.areas);
        })
        .catch(() => undefined),
    ])
      .catch((err: unknown) => {
        if (!cancel) onError(err instanceof Error ? err.message : "No se pudieron cargar colaboradores");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [token, load, onError]);

  const filtered = useMemo(() => rows, [rows]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, hiredAt: today(), issuedAt: today() });
    setQrSvg("");
    setAudits([]);
    setOpen(true);
  }

  async function openEdit(row: Collaborator) {
    setEditing(row);
    setForm(fromRow(row));
    setOpen(true);
    setQrSvg("");
    setAudits([]);
    if (!token) return;
    try {
      const [svgRes, auditData] = await Promise.all([
        fetch(apiUrl(`/api/collaborators/${row.id}/qr.svg`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api<{ audits: Audit[] }>(`/api/collaborators/${row.id}/audits`, { token }),
      ]);
      if (svgRes.ok) setQrSvg(await svgRes.text());
      setAudits(Array.isArray(auditData.audits) ? auditData.audits : []);
    } catch {
      /* preview still usable */
    }
  }

  async function onPhoto(file: File | null) {
    if (!file || !token) return;
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const uploaded = await api<{ url: string; absoluteUrl?: string }>(
        "/api/collaborators/photo",
        { method: "POST", token, body: formData },
      );
      patch("photoPath", uploaded.url);
      patch("photoPreview", uploaded.absoluteUrl || apiUrl(uploaded.url));
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo subir la foto");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!/^\d{8}$/.test(form.dni.trim())) {
      onError("El DNI debe tener 8 dígitos");
      return;
    }
    if (!editing && !form.photoPath) {
      onError("Sube la fotografía del colaborador");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        dni: form.dni,
        personalPhone: form.personalPhone,
        photoPath: form.photoPath || undefined,
        position: form.position,
        area: form.area,
        hiredAt: form.hiredAt,
        employmentStatus: form.employmentStatus,
        corporateEmail: form.corporateEmail,
        corporatePhone: form.corporatePhone,
        issuedAt: form.issuedAt,
        expiresAt: form.expiresAt || null,
      };
      if (editing) {
        await api(`/api/collaborators/${editing.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
        onToast("Colaborador actualizado");
      } else {
        await api("/api/collaborators", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        onToast("Colaborador registrado");
      }
      setOpen(false);
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: Collaborator) {
    if (!token) return;
    const next = row.employmentStatus === "active" ? "inactive" : "active";
    try {
      await api(`/api/collaborators/${row.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ employmentStatus: next }),
      });
      onToast(next === "inactive" ? "Credencial desactivada" : "Colaborador reactivado");
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    }
  }

  async function downloadQr(row: Collaborator, type: "png" | "svg") {
    if (!token) return;
    try {
      const res = await fetch(apiUrl(`/api/collaborators/${row.id}/qr.${type}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo descargar el QR");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${row.code}-qr.${type}`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo descargar el QR");
    }
  }

  return (
    <div className="admin__card collab-admin">
      <div className="admin__card-head">
        <h2>Fotochecks y Colaboradores</h2>
        <button type="button" className="admin__btn admin__btn--primary" onClick={openCreate}>
          Registrar colaborador
        </button>
      </div>

      <div className="collab-admin__filters">
        <label className="admin__field">
          Área
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
            <option value="">Todas</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
        <label className="admin__field">
          Estado laboral
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>
        <p className="collab-admin__hint">
          El buscador superior filtra por nombre, apellido, código o cargo.
        </p>
      </div>

      {loading ? (
        <p className="admin__muted">Cargando colaboradores…</p>
      ) : filtered.length === 0 ? (
        <div className="admin__empty">
          <strong>Sin colaboradores</strong>
          Registra al personal de FADEY SOLUTIONS para emitir fotochecks y QR de verificación.
        </div>
      ) : (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Colaborador</th>
                <th>Cargo</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Credencial</th>
                <th>Actualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.code}</strong>
                  </td>
                  <td>
                    <div className="collab-admin__person">
                      <img src={row.photoUrl} alt="" />
                      <span>
                        {row.firstName} {row.lastName}
                      </span>
                    </div>
                  </td>
                  <td>{row.position}</td>
                  <td>{row.area}</td>
                  <td>
                    <span className={`collab-pill collab-pill--${row.employmentStatus}`}>
                      {row.employmentStatus === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <span className={`collab-pill collab-pill--${row.credentialStatus}`}>
                      {row.credentialStatus}
                    </span>
                  </td>
                  <td>{row.updatedAt.slice(0, 10)}</td>
                  <td className="collab-admin__actions">
                    <button type="button" className="linkish" onClick={() => void openEdit(row)}>
                      Editar
                    </button>
                    <button type="button" className="linkish" onClick={() => setPreview(row)}>
                      Fotocheck
                    </button>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => window.open(`/colaboradores/${row.code}`, "_blank")}
                    >
                      Perfil
                    </button>
                    <button type="button" className="linkish" onClick={() => void downloadQr(row, "png")}>
                      QR PNG
                    </button>
                    <button type="button" className="linkish" onClick={() => void downloadQr(row, "svg")}>
                      QR SVG
                    </button>
                    <button type="button" className="linkish" onClick={() => void toggleStatus(row)}>
                      {row.employmentStatus === "active" ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <div className="admin__modal-backdrop" onClick={() => setOpen(false)}>
          <form
            className="admin__modal collab-admin__form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void submit(e)}
          >
            <h3>{editing ? `Editar ${editing.code}` : "Nuevo colaborador"}</h3>
            <p className="admin__muted">
              El código y la URL pública se mantienen si actualizas cargo o fotografía.
            </p>
            <div className="collab-admin__form-grid">
              <label className="admin__field">
                Nombres
                <input required value={form.firstName} onChange={(e) => patch("firstName", e.target.value)} />
              </label>
              <label className="admin__field">
                Apellidos
                <input required value={form.lastName} onChange={(e) => patch("lastName", e.target.value)} />
              </label>
              <label className="admin__field">
                DNI
                <input required inputMode="numeric" maxLength={8} value={form.dni} onChange={(e) => patch("dni", e.target.value)} />
              </label>
              <label className="admin__field">
                Teléfono personal (opcional, no se publica)
                <input value={form.personalPhone} onChange={(e) => patch("personalPhone", e.target.value)} />
              </label>
              <div className="collab-admin__photo-row">
                <label className="admin__field">
                  Fotografía
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void onPhoto(e.target.files?.[0] || null)} />
                </label>
                {form.photoPreview ? (
                  <img className="collab-admin__photo" src={form.photoPreview} alt="Fotografía del colaborador" />
                ) : null}
              </div>
              <label className="admin__field">
                Cargo
                <input required value={form.position} onChange={(e) => patch("position", e.target.value)} />
              </label>
              <label className="admin__field">
                Área
                <select value={form.area} onChange={(e) => patch("area", e.target.value)}>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin__field">
                Incorporación
                <input type="date" required value={form.hiredAt} onChange={(e) => patch("hiredAt", e.target.value)} />
              </label>
              <label className="admin__field">
                Estado laboral
                <select
                  value={form.employmentStatus}
                  onChange={(e) => patch("employmentStatus", e.target.value as "active" | "inactive")}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>
              <label className="admin__field">
                Correo corporativo
                <input type="email" value={form.corporateEmail} onChange={(e) => patch("corporateEmail", e.target.value)} />
              </label>
              <label className="admin__field">
                Teléfono corporativo
                <input value={form.corporatePhone} onChange={(e) => patch("corporatePhone", e.target.value)} />
              </label>
              <label className="admin__field">
                Emisión
                <input type="date" required value={form.issuedAt} onChange={(e) => patch("issuedAt", e.target.value)} />
              </label>
              <label className="admin__field">
                Vencimiento (opcional)
                <input type="date" value={form.expiresAt} onChange={(e) => patch("expiresAt", e.target.value)} />
              </label>
              {editing ? (
                <p className="admin__muted">Código permanente: {editing.code}</p>
              ) : null}
              {qrSvg || audits.length > 0 ? (
                <div className="collab-admin__side">
                  {qrSvg ? <div className="collab-admin__qr" dangerouslySetInnerHTML={{ __html: qrSvg }} /> : null}
                  {audits.length > 0 ? (
                    <div className="collab-admin__audits">
                      <strong>Historial</strong>
                      <ul>
                        {audits.map((item) => (
                          <li key={item.id}>
                            {item.createdAt.slice(0, 16).replace("T", " ")} · {item.action}
                            {item.detail ? ` — ${item.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="collab-admin__form-actions">
              <button type="button" className="admin__btn" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="admin__btn admin__btn--primary" disabled={saving}>
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {preview ? (
        <BadgePreview
          row={preview}
          token={token}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}

function formatBadgePhone(raw?: string | null) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "—";
  const local = digits.startsWith("51") && digits.length >= 11 ? digits.slice(-9) : digits;
  if (local.length === 9) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return raw?.trim() || "—";
}

function roleGlyph(position: string) {
  const p = position.toLowerCase();
  if (/desarroll|program|software|sistemas|\bdev\b|\bti\b|tecnolog/.test(p)) return "</>";
  if (/geren|director|jefe/.test(p)) return "★";
  if (/comercial|ventas/.test(p)) return "◈";
  return "▣";
}

function BadgeChrome() {
  return (
    <>
      <span className="fotocheck__slot" />
      <span className="fotocheck__corner fotocheck__corner--tl" />
      <span className="fotocheck__corner fotocheck__corner--tr" />
      <span className="fotocheck__corner fotocheck__corner--bl" />
      <span className="fotocheck__corner fotocheck__corner--br" />
      <span className="fotocheck__bar fotocheck__bar--l" />
      <span className="fotocheck__bar fotocheck__bar--r" />
    </>
  );
}

function BadgeBrand() {
  return (
    <header className="fotocheck__brand">
      <img className="fotocheck__mark" src="/logo-fadey.png" alt="" />
      <strong>FADEY</strong>
      <span>SOLUTIONS</span>
    </header>
  );
}

function BadgeFooter() {
  return (
    <footer className="fotocheck__footer">
      <span>
        INNOVACIÓN
        <br />
        EN SOLUCIONES
      </span>
      <em>Fadey Solutions</em>
    </footer>
  );
}

function FactIcon({ kind }: { kind: "dni" | "phone" | "area" | "id" }) {
  const paths = {
    dni: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 9a7 7 0 0 1 14 0",
    phone: "M7 3h4l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v4a2 2 0 0 1-2 2A16 16 0 0 1 5 7a2 2 0 0 1 2-4Z",
    area: "M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 10ZM3 20a6 6 0 0 1 12 0H3Zm12.5 0a5 5 0 0 1 6.5 0",
    id: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 4v5l3 2",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={paths[kind]}
      />
    </svg>
  );
}

function BadgePreview({
  row,
  token,
  onClose,
}: {
  row: Collaborator;
  token: string | null;
  onClose: () => void;
}) {
  const [qr, setQr] = useState("");
  const phone = formatBadgePhone(row.corporatePhone || row.personalPhone);
  const fullName = `${row.firstName} ${row.lastName}`.trim().toUpperCase();

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    fetch(apiUrl(`/api/collaborators/${row.id}/qr.svg`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.text() : ""))
      .then((svg) => {
        if (!cancel) setQr(svg);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [row.id, token]);

  const printBadge = () => {
    const root = document.documentElement;
    root.classList.add("is-fotocheck-print");
    const done = () => {
      root.classList.remove("is-fotocheck-print");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  return (
    <div className="admin__modal-backdrop" onClick={onClose}>
      <div className="collab-print" onClick={(e) => e.stopPropagation()}>
        <div className="collab-print__toolbar">
          <strong>Vista previa del fotocheck</strong>
          <div>
            <button
              type="button"
              className="admin__btn admin__btn--primary"
              onClick={printBadge}
              disabled={!qr}
            >
              Imprimir / PDF
            </button>
            <button type="button" className="admin__btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
        <div className="collab-print__sheet">
          <div className="fotocheck-frame">
            <article className="fotocheck fotocheck--front">
              <BadgeChrome />
              <BadgeBrand />
              <div className="fotocheck__photo-ring">
                <img src={row.photoUrl} alt="" />
              </div>
              <h3 className="fotocheck__name">{fullName}</h3>
              <p className="fotocheck__role">
                <span>{roleGlyph(row.position)}</span>
                {row.position}
              </p>
              <ul className="fotocheck__facts">
                <li>
                  <FactIcon kind="dni" />
                  <span>DNI:</span>
                  <strong>{row.dni || "—"}</strong>
                </li>
                <li>
                  <FactIcon kind="phone" />
                  <span>TELÉFONO:</span>
                  <strong>{phone}</strong>
                </li>
                <li>
                  <FactIcon kind="area" />
                  <span>ÁREA:</span>
                  <strong>{row.area || "—"}</strong>
                </li>
                <li>
                  <FactIcon kind="id" />
                  <span>ID:</span>
                  <strong>{row.code}</strong>
                </li>
              </ul>
              <BadgeFooter />
            </article>
          </div>
          <div className="fotocheck-frame">
            <article className="fotocheck fotocheck--back">
              <BadgeChrome />
              <BadgeBrand />
              <div className="fotocheck__qr-wrap">
                <div className="fotocheck__qr" dangerouslySetInnerHTML={{ __html: qr }} />
                <img className="fotocheck__qr-logo" src="/logo-fadey.png" alt="" />
              </div>
              <p className="fotocheck__scan">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="2" width="12" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M9 18h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span>
                  ESCANEA PARA VER
                  <br />
                  EL PERFIL DEL COLABORADOR
                </span>
              </p>
              <p className="fotocheck__web">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                www.fadeysolutions.pe
              </p>
              <ul className="fotocheck__values">
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  COMPROMISO
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3v4M9 14a3 3 0 1 0 6 0c0-2-3-4-3-7 0 3-3 5-3 7Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M9 20h6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  INNOVACIÓN
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 19V11M10 19V7M15 19v-6M20 19V5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  RESULTADOS
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 10ZM4 20a5.5 5.5 0 0 1 11 0H4Zm12 0a4.5 4.5 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  TRABAJO EN EQUIPO
                </li>
              </ul>
              <footer className="fotocheck__footer fotocheck__footer--center">
                <span>
                  INNOVACIÓN
                  <br />
                  EN SOLUCIONES
                </span>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
