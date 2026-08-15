import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { mailtoInfo, msgInfo, waUrl } from "../lib/whatsapp";
import "./CTA.css";

const WHATSAPP_URL = waUrl(msgInfo());
const MAILTO_URL = mailtoInfo();

export function CTA() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      await api("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          company: data.get("company"),
          email: data.get("email"),
          intent: data.get("intent"),
          message: data.get("message"),
        }),
      });
      setSent(true);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar. Intenta de nuevo o escríbenos por WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="cta section section--light section--light-d"
      id="contacto"
    >
      <div className="container">
        <div className="cta__grid">
        <div className="cta__left reveal">
          <div className="cta__copy">
            <span className="section__label">Contacto</span>
            <h2 className="section__title">
              Llevemos tu negocio al siguiente nivel
            </h2>
            <p className="section__lead">
              Cuéntanos qué necesitas: Resto Fadey, ERP Fadey, una página web o
              soporte. Te respondemos con una propuesta clara.
            </p>
          </div>

          <div className="cta__quick">
            <p className="cta__quick-title">Acceso rápido</p>
            <div className="cta__quick-actions">
              <a
                className="btn btn--whatsapp"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.52 3.48A11.8 11.8 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.86 11.86 0 0 0 5.76 1.47h.01c6.55 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.44ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 7 2.9 9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.49 1.9.82 2.64.88 3.59.74.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
                </svg>
                WhatsApp
              </a>
              <a className="btn btn--dark" href={MAILTO_URL}>
                Escribir por correo
              </a>
            </div>
          </div>
        </div>

        <form className="cta-form reveal" onSubmit={onSubmit}>
          {sent ? (
            <div className="cta-form__success" role="status">
              <strong>¡Registro recibido!</strong>
              <p>
                Gracias por escribirnos. Guardamos tus datos y pronto te
                contactaremos para avanzar con tu proyecto.
              </p>
            </div>
          ) : (
            <>
              <div className="cta-form__row">
                <label>
                  Nombre
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Tu nombre"
                  />
                </label>
                <label>
                  Empresa
                  <input
                    name="company"
                    type="text"
                    placeholder="Nombre de tu empresa"
                  />
                </label>
              </div>
              <label>
                Correo
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="correo@empresa.com"
                />
              </label>
              <label>
                ¿Qué estás buscando?
                <select name="intent" required defaultValue="">
                  <option value="" disabled>
                    Selecciona una opción
                  </option>
                  <option value="resto">Resto Fadey</option>
                  <option value="erp">ERP Fadey</option>
                  <option value="web">Desarrollo web</option>
                  <option value="soporte">Soporte</option>
                </select>
              </label>
              <label>
                Mensaje
                <textarea
                  name="message"
                  rows={2}
                  placeholder="Cuéntanos brevemente tu necesidad"
                />
              </label>
              {error && <p className="cta-form__error">{error}</p>}
              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? "Enviando…" : "Solicitar cotización"}
              </button>
            </>
          )}
        </form>
        </div>
      </div>
    </section>
  );
}
