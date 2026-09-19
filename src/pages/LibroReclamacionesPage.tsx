import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { WhatsAppFloat } from "../components/WhatsAppFloat";
import { api } from "../lib/api";
import { mailtoInfo } from "../lib/whatsapp";
import "./LibroReclamaciones.css";

type SubmitResult = {
  folio: string;
  createdAt: string;
  message?: string;
};

export function LibroReclamacionesPage() {
  const [sent, setSent] = useState<SubmitResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const result = await api<SubmitResult>("/api/reclamaciones", {
        method: "POST",
        body: JSON.stringify({
          consumerName: data.get("consumerName"),
          documentType: data.get("documentType"),
          documentNumber: data.get("documentNumber"),
          address: data.get("address"),
          phone: data.get("phone"),
          email: data.get("email"),
          guardianName: data.get("guardianName"),
          goodsType: data.get("goodsType"),
          goodsDescription: data.get("goodsDescription"),
          claimedAmount: data.get("claimedAmount"),
          claimKind: data.get("claimKind"),
          detail: data.get("detail"),
          request: data.get("request"),
        }),
      });
      setSent(result);
      form.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la reclamación. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="libro">
        <div className="container libro__wrap">
          <div className="libro__banner">
            <div className="libro__banner-mark" aria-hidden="true">
              LR
            </div>
            <div>
              <p className="libro__eyebrow">Código de Protección y Defensa del Consumidor</p>
              <h1>Libro de Reclamaciones</h1>
              <p className="libro__lead">
                Conforme a la Ley N.º 29571. FADEY SOLUTIONS S.A.C. pone a tu
                disposición este formulario para registrar reclamos y quejas.
              </p>
            </div>
          </div>

          <div className="libro__provider">
            <h2>Datos del proveedor</h2>
            <dl>
              <div>
                <dt>Razón social</dt>
                <dd>FADEY SOLUTIONS S.A.C.</dd>
              </div>
              <div>
                <dt>RUC</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Domicilio</dt>
                <dd>Lima, Perú</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>
                  <a href={mailtoInfo()}>
                    fadeysolutions@gmail.com
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {sent ? (
            <div className="libro__success" role="status">
              <strong>Reclamación registrada</strong>
              <p>
                Tu folio es <code>{sent.folio}</code>. Guárdalo para el
                seguimiento. Te responderemos al correo indicado dentro del plazo
                legal.
              </p>
              <div className="libro__success-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setSent(null)}
                >
                  Registrar otra
                </button>
                <Link className="btn btn--dark" to="/">
                  Volver al inicio
                </Link>
              </div>
            </div>
          ) : (
            <form className="libro-form" onSubmit={onSubmit}>
              <fieldset>
                <legend>1. Identificación del consumidor</legend>
                <div className="libro-form__row">
                  <label>
                    Nombre completo *
                    <input name="consumerName" type="text" required maxLength={120} />
                  </label>
                  <label>
                    Correo electrónico *
                    <input name="email" type="email" required maxLength={120} />
                  </label>
                </div>
                <div className="libro-form__row libro-form__row--3">
                  <label>
                    Tipo de documento *
                    <select name="documentType" required defaultValue="DNI">
                      <option value="DNI">DNI</option>
                      <option value="CE">Carnet de extranjería</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </label>
                  <label>
                    N.º de documento *
                    <input
                      name="documentNumber"
                      type="text"
                      required
                      maxLength={20}
                    />
                  </label>
                  <label>
                    Teléfono *
                    <input name="phone" type="tel" required maxLength={30} />
                  </label>
                </div>
                <label>
                  Domicilio *
                  <input name="address" type="text" required maxLength={200} />
                </label>
                <label>
                  Padre / madre / tutor (si es menor de edad)
                  <input name="guardianName" type="text" maxLength={120} />
                </label>
              </fieldset>

              <fieldset>
                <legend>2. Identificación del bien contratado</legend>
                <div className="libro-form__row">
                  <label>
                    Tipo *
                    <select name="goodsType" required defaultValue="servicio">
                      <option value="producto">Producto</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </label>
                  <label>
                    Monto reclamado (S/)
                    <input
                      name="claimedAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Opcional"
                    />
                  </label>
                </div>
                <label>
                  Descripción del producto o servicio *
                  <textarea
                    name="goodsDescription"
                    required
                    rows={3}
                    maxLength={800}
                    placeholder="Ej. Suscripción Resto Fadey, desarrollo web, soporte técnico…"
                  />
                </label>
              </fieldset>

              <fieldset>
                <legend>3. Detalle de la reclamación</legend>
                <label>
                  Tipo *
                  <select name="claimKind" required defaultValue="reclamo">
                    <option value="reclamo">
                      Reclamo — disconformidad relacionada al producto o servicio
                    </option>
                    <option value="queja">
                      Queja — malestar o descontento respecto a la atención
                    </option>
                  </select>
                </label>
                <label>
                  Detalle *
                  <textarea
                    name="detail"
                    required
                    rows={5}
                    maxLength={2000}
                    placeholder="Describe los hechos con claridad"
                  />
                </label>
                <label>
                  Pedido del consumidor *
                  <textarea
                    name="request"
                    required
                    rows={3}
                    maxLength={1000}
                    placeholder="¿Qué solicitas como solución?"
                  />
                </label>
              </fieldset>

              <p className="libro-form__note">
                La formulación del reclamo no impide acudir a otras vías de
                solución de controversias ni es requisito previo para interponer
                una denuncia ante el INDECOPI.
              </p>

              {error && <p className="libro-form__error">{error}</p>}

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? "Enviando…" : "Registrar en el libro"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
