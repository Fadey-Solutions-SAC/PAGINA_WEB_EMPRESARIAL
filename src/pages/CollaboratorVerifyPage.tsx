import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { api } from "../lib/api";
import { msgCollaboratorVerify, waUrl } from "../lib/whatsapp";
import "./CollaboratorVerifyPage.css";

type PublicCollaborator = {
  code: string;
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl: string;
  position: string;
  area: string;
  employmentStatus: "active" | "inactive";
  credentialStatus: "vigente" | "inactiva" | "vencida";
  issuedAt: string;
  expiresAt: string | null;
  updatedAt: string;
};

export function CollaboratorVerifyPage() {
  const { code = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<PublicCollaborator | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setMissing(false);
    setRow(null);
    const lookup = encodeURIComponent(code.trim());
    if (!lookup) {
      setMissing(true);
      setLoading(false);
      return;
    }
    api<{ collaborator: PublicCollaborator }>(`/api/public/collaborators/${lookup}`)
      .then((data) => {
        if (cancel) return;
        setRow(data.collaborator || null);
        if (!data.collaborator) setMissing(true);
      })
      .catch(() => {
        if (!cancel) setMissing(true);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [code]);

  const vigente = row?.credentialStatus === "vigente" && row.employmentStatus === "active";
  const title = missing
    ? "Credencial no encontrada"
    : row
      ? `Verificación de colaborador ${row.code}`
      : "Verificación de colaborador";

  useEffect(() => {
    document.title = `${title} — FADEY SOLUTIONS`;
    return () => {
      document.title = "FADEY SOLUTIONS";
    };
  }, [title]);

  return (
    <>
      <Header />
      <main className="verify">
        <div className="container verify__wrap">
          {loading ? (
            <article className="verify__card">
              <img className="verify__logo" src="/logo-fadey.png" alt="FADEY SOLUTIONS" />
              <p className="verify__muted">Verificando credencial…</p>
            </article>
          ) : missing || !row ? (
            <article className="verify__card">
              <img className="verify__logo" src="/logo-fadey.png" alt="FADEY SOLUTIONS" />
              <p className="verify__eyebrow">FADEY SOLUTIONS</p>
              <h1>Credencial no encontrada</h1>
              <p className="verify__lead">
                No existe un perfil público asociado a este código. Si recibiste esta
                credencial, comunícate con FADEY SOLUTIONS a través de sus canales oficiales.
              </p>
              <div className="verify__actions">
                <a
                  className="verify__btn verify__btn--wa"
                  href={waUrl(msgCollaboratorVerify())}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contactar con FADEY SOLUTIONS
                </a>
                <Link className="verify__btn verify__btn--home" to="/">
                  Más sobre FADEY SOLUTIONS
                </Link>
              </div>
            </article>
          ) : (
            <article className={`verify__card ${vigente ? "is-ok" : "is-off"}`}>
              <img className="verify__logo" src="/logo-fadey.png" alt="FADEY SOLUTIONS" />
              <p className="verify__eyebrow">FADEY SOLUTIONS</p>
              <h1>Verificación de colaborador</h1>
              <img
                className="verify__photo"
                src={row.photoUrl}
                alt={`${row.fullName}, colaborador de FADEY SOLUTIONS`}
              />
              <h2>{row.fullName}</h2>
              <p className="verify__code">{row.code}</p>
              <dl className="verify__meta">
                <div>
                  <dt>Cargo</dt>
                  <dd>{row.position}</dd>
                </div>
                <div>
                  <dt>Área de trabajo</dt>
                  <dd>{row.area}</dd>
                </div>
                <div>
                  <dt>Estado de la credencial</dt>
                  <dd className={vigente ? "is-ok" : "is-off"}>
                    {row.credentialStatus === "vigente"
                      ? "Vigente"
                      : row.credentialStatus === "vencida"
                        ? "Vencida"
                        : "No vigente"}
                  </dd>
                </div>
                <div>
                  <dt>Estado laboral</dt>
                  <dd className={row.employmentStatus === "active" && vigente ? "is-ok" : "is-off"}>
                    {row.employmentStatus === "active" ? "Activo" : "Inactivo"}
                  </dd>
                </div>
              </dl>
              {vigente ? (
                <p className="verify__status verify__status--ok">
                  Esta credencial se encuentra vigente. La persona identificada forma parte del
                  equipo de FADEY SOLUTIONS a la fecha de esta consulta.
                </p>
              ) : (
                <p className="verify__status verify__status--off">
                  Esta credencial ya no se encuentra vigente. Para confirmar cualquier información,
                  comunícate con FADEY SOLUTIONS a través de sus canales oficiales.
                </p>
              )}
              <p className="verify__note">
                Esta página confirma únicamente la identidad laboral publicada por FADEY SOLUTIONS.
                No autoriza por sí sola operaciones, cobros ni representaciones específicas.
              </p>
              <div className="verify__actions">
                <a
                  className="verify__btn verify__btn--wa"
                  href={waUrl(msgCollaboratorVerify(row.code))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contactar con FADEY SOLUTIONS
                </a>
                <Link className="verify__btn verify__btn--home" to="/">
                  Más sobre FADEY SOLUTIONS
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
