import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
    setPhotoUploading(true);
    try {
      const uploaded = await api<{ url: string; absoluteUrl?: string }>(
        "/api/collaborators/photo",
        { method: "POST", token, body: formData },
      );
      setForm((prev) => ({
        ...prev,
        photoPath: uploaded.url,
        photoPreview: uploaded.absoluteUrl || apiUrl(uploaded.url),
      }));
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function removeCollaborator() {
    if (!token || !editing) return;
    const ok = window.confirm(
      `¿Eliminar a ${editing.firstName} ${editing.lastName} (${editing.code})? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api(`/api/collaborators/${editing.id}`, { method: "DELETE", token });
      onToast("Colaborador eliminado");
      setOpen(false);
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setDeleting(false);
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
                <span className="collab-admin__photo-label">Fotografía</span>
                <input
                  ref={photoInputRef}
                  className="collab-admin__photo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    void onPhoto(e.target.files?.[0] || null);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="collab-admin__photo-pick"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading || saving || deleting}
                >
                  {form.photoPreview ? (
                    <img className="collab-admin__photo" src={form.photoPreview} alt="" />
                  ) : (
                    <span className="collab-admin__photo-placeholder">Foto</span>
                  )}
                  <span>
                    {photoUploading
                      ? "Subiendo…"
                      : form.photoPreview
                        ? "Cambiar fotografía"
                        : "Subir fotografía"}
                  </span>
                </button>
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
              {editing ? (
                <button
                  type="button"
                  className="admin__btn admin__btn--danger"
                  onClick={() => void removeCollaborator()}
                  disabled={saving || deleting || photoUploading}
                >
                  {deleting ? "Eliminando…" : "Eliminar"}
                </button>
              ) : null}
              <button type="button" className="admin__btn" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button
                type="submit"
                className="admin__btn admin__btn--primary"
                disabled={saving || deleting || photoUploading}
              >
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

async function rasterizeFotocheck(
  html2canvas: (typeof import("html2canvas"))["default"],
  source: HTMLElement,
) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:54mm;height:85.6mm;overflow:hidden;pointer-events:none;";
  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.width = "54mm";
  clone.style.height = "85.6mm";
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    const imgs = Array.from(clone.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.crossOrigin = "anonymous";
            if (img.complete && img.naturalWidth) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            img.src = img.src;
          }),
      ),
    );
    const canvas = await html2canvas(clone, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#050505",
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } finally {
    host.remove();
  }
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
  const [downloading, setDownloading] = useState(false);
  const frontRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLElement>(null);
  const phone = formatBadgePhone(row.corporatePhone || row.personalPhone);
  const fullName = `${row.firstName} ${row.lastName}`.trim().toUpperCase();

  useEffect(() => {
    document.documentElement.classList.add("is-fotocheck-preview");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.classList.remove("is-fotocheck-preview");
      document.body.style.overflow = prevOverflow;
    };
  }, []);

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

  const downloadBadge = async () => {
    if (!frontRef.current || !backRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const frontImg = await rasterizeFotocheck(html2canvas, frontRef.current);
      const backImg = await rasterizeFotocheck(html2canvas, backRef.current);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [54, 85.6],
        compress: true,
      });
      pdf.addImage(frontImg, "PNG", 0, 0, 54, 85.6);
      pdf.addPage([54, 85.6], "portrait");
      pdf.addImage(backImg, "PNG", 0, 0, 54, 85.6);
      pdf.save(`${row.code}-fotocheck.pdf`);
    } catch {
      /* keep preview usable */
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="admin__modal-backdrop collab-print-overlay" onClick={onClose}>
      <div className="collab-print" onClick={(e) => e.stopPropagation()}>
        <div className="collab-print__toolbar">
          <strong>Vista previa del fotocheck</strong>
          <div>
            <button
              type="button"
              className="admin__btn admin__btn--primary"
              onClick={() => void downloadBadge()}
              disabled={!qr || downloading}
            >
              {downloading ? "Descargando…" : "Descargar"}
            </button>
            <button type="button" className="admin__btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
        <div className="collab-print__sheet">
          <div className="fotocheck-frame">
            <article ref={frontRef} className="fotocheck fotocheck--front">
              <img className="fotocheck__photo" src={row.photoUrl} alt="" crossOrigin="anonymous" />
              <h3 className="fotocheck__name">{fullName}</h3>
              <p className="fotocheck__role">{row.position}</p>
              <ul className="fotocheck__facts">
                <li>
                  <span>DNI</span>
                  <strong>{row.dni || "—"}</strong>
                </li>
                <li>
                  <span>TEL</span>
                  <strong>{phone}</strong>
                </li>
                <li>
                  <span>ÁREA</span>
                  <strong>{row.area || "—"}</strong>
                </li>
                <li>
                  <span>ID</span>
                  <strong>{row.code}</strong>
                </li>
              </ul>
            </article>
          </div>
          <div className="fotocheck-frame">
            <article ref={backRef} className="fotocheck fotocheck--back">
              <div className="fotocheck__qr" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="fotocheck__scan">ESCANEA PARA VER EL PERFIL DEL COLABORADOR</p>
              <p className="fotocheck__web">www.fadeysolutions.pe</p>
            </article>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
