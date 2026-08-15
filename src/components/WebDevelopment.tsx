import { useEffect, useId, useState, type FormEvent } from "react";
import { msgWebProject, waUrl, type WebProjectForm } from "../lib/whatsapp";
import "./WebDevelopment.css";

const services = [
  {
    title: "Página web empresarial",
    desc: "Para empresas y corporaciones que necesitan presencia profesional y sólida.",
  },
  {
    title: "Landing Page",
    desc: "Para campañas, productos y servicios con foco en conversión.",
  },
  {
    title: "Tiendas online",
    desc: "Para negocios que desean vender por Internet con catálogo y pagos.",
  },
  {
    title: "Páginas para restaurantes",
    desc: "Menús digitales, reservas, pedidos y presencia online gastronómica.",
  },
  {
    title: "Plataformas personalizadas",
    desc: "Sistemas web desarrollados específicamente para las necesidades del cliente.",
  },
];

const tiers = [
  {
    from: "500",
    label: "Proyectos profesionales y personalizados.",
  },
  {
    from: "1,000",
    label: "Proyectos con mayor complejidad y funcionalidades.",
  },
  {
    from: "2,000+",
    label: "Plataformas web y proyectos empresariales de alta complejidad.",
  },
];

const projectTypes = [
  {
    value: "Página web empresarial",
    label: "Empresarial",
    hint: "Sitio corporativo",
  },
  {
    value: "Landing Page",
    label: "Landing",
    hint: "Una página de conversión",
  },
  {
    value: "Tienda online",
    label: "Tienda",
    hint: "Catálogo y ventas",
  },
  {
    value: "Página para restaurante",
    label: "Restaurante",
    hint: "Menú y reservas",
  },
  {
    value: "Plataforma personalizada",
    label: "A medida",
    hint: "Sistema web propio",
  },
];

const budgets = [
  { value: "Desde S/ 500", label: "Desde S/ 500", hint: "Proyecto base" },
  { value: "Desde S/ 1,000", label: "Desde S/ 1,000", hint: "Más funciones" },
  { value: "Desde S/ 2,000+", label: "Desde S/ 2,000+", hint: "Alta complejidad" },
  { value: "A cotizar", label: "A cotizar", hint: "Sin rango definido" },
];

const emptyForm: WebProjectForm = {
  projectType: "",
  budget: "",
  timeline: "",
  structure: "",
  name: "",
  contact: "",
};

export function WebDevelopment() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WebProjectForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function closeModal() {
    setOpen(false);
    setFormError("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.projectType) {
      setFormError("Elige el tipo de proyecto.");
      return;
    }
    if (!form.budget) {
      setFormError("Elige un presupuesto aproximado.");
      return;
    }
    setFormError("");
    window.open(waUrl(msgWebProject(form)), "_blank", "noopener,noreferrer");
    closeModal();
    setForm(emptyForm);
  }

  return (
    <section className="web section" id="web">
      <div className="web__bg" aria-hidden="true" />
      <div className="web__overlay" aria-hidden="true" />
      <div className="container">
        <div className="web__intro reveal">
          <span className="section__label">03 · Desarrollo web</span>
          <h2 className="section__title">Tu negocio. Tu idea. Tu página.</h2>
          <p className="section__lead">
            Diseñamos y desarrollamos sitios web a medida según los objetivos,
            necesidades y características de cada empresa. Cada proyecto se
            cotiza de forma personalizada.
          </p>
        </div>

        <div className="web__grid">
          {services.map((service) => (
            <article key={service.title} className="web-card reveal">
              <div className="web-card__icon" aria-hidden="true">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <path d="M3 9h18M8 20h8" />
                </svg>
              </div>
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </article>
          ))}
        </div>

        <div className="web__pricing reveal">
          <div className="web__pricing-head">
            <h3>Inversión estimada</h3>
            <p>
              El precio final se determina después de analizar los
              requerimientos del proyecto.
            </p>
          </div>
          <div className="web__tiers">
            {tiers.map((tier) => (
              <article key={tier.from} className="web-tier">
                <p>
                  Desde <strong>S/ {tier.from}</strong>
                </p>
                <span>{tier.label}</span>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setOpen(true)}
          >
            Solicitar proyecto web
          </button>
        </div>
      </div>

      {open && (
        <div
          className="web-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="web-modal__backdrop"
            aria-label="Cerrar"
            onClick={closeModal}
          />
          <div className="web-modal__panel">
            <header className="web-modal__head">
              <div className="web-modal__head-text">
                <p className="web-modal__eyebrow">Desarrollo web</p>
                <h2 id={titleId}>Solicitar proyecto</h2>
                <p>Completa y te abrimos WhatsApp con el mensaje listo.</p>
              </div>
              <button
                type="button"
                className="web-modal__close"
                onClick={closeModal}
                aria-label="Cerrar formulario"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <form className="web-modal__form" onSubmit={onSubmit}>
              <fieldset className="web-modal__fieldset">
                <legend>Tipo de proyecto</legend>
                <div className="web-modal__choices" role="radiogroup">
                  {projectTypes.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={form.projectType === opt.value}
                      className={`web-modal__choice ${form.projectType === opt.value ? "is-selected" : ""}`}
                      onClick={() =>
                        setForm((f) => ({ ...f, projectType: opt.value }))
                      }
                    >
                      <strong>{opt.label}</strong>
                      <span>{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="web-modal__fieldset">
                <legend>Presupuesto aproximado</legend>
                <div className="web-modal__choices web-modal__choices--budget" role="radiogroup">
                  {budgets.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={form.budget === opt.value}
                      className={`web-modal__choice ${form.budget === opt.value ? "is-selected" : ""}`}
                      onClick={() =>
                        setForm((f) => ({ ...f, budget: opt.value }))
                      }
                    >
                      <strong>{opt.label}</strong>
                      <span>{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <label>
                Tiempo deseado
                <input
                  type="text"
                  required
                  placeholder="Ej. 3–4 semanas"
                  value={form.timeline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, timeline: e.target.value }))
                  }
                />
              </label>

              <label>
                Estructura / páginas
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. Inicio, servicios, contacto…"
                  value={form.structure}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, structure: e.target.value }))
                  }
                />
              </label>

              <div className="web-modal__row">
                <label>
                  Nombre
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Contacto
                  <input
                    type="text"
                    required
                    inputMode="tel"
                    placeholder="Teléfono o correo"
                    value={form.contact}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contact: e.target.value }))
                    }
                  />
                </label>
              </div>

              {formError && (
                <p className="web-modal__error" role="alert">
                  {formError}
                </p>
              )}

              <div className="web-modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost web-modal__cancel"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button className="btn btn--primary" type="submit">
                  Enviar por WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
