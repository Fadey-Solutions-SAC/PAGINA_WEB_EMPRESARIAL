import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { msgWebProject, waUrl, type WebProjectForm } from "../lib/whatsapp";
import { WebDevelopmentDetails } from "./WebDevelopmentDetails";
import "./WebDevelopment.css";

const services = [
  {
    title: "Página web empresarial",
    desc: "Presencia profesional para tu empresa.",
    icon: "business",
  },
  {
    title: "Landing Page",
    desc: "Diseñada para presentar y convertir.",
    icon: "landing",
  },
  {
    title: "Tienda online",
    desc: "Catálogo, productos y ventas por internet.",
    icon: "store",
  },
  {
    title: "Web gastronómica",
    desc: "Menús digitales, reservas y pedidos online.",
    icon: "restaurant",
  },
  {
    title: "Plataformas personalizadas",
    desc: "Sistemas web adaptados a tu operación.",
    icon: "platform",
  },
] as const;

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

function ServiceIcon({ type }: { type: (typeof services)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (type) {
    case "business":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 20v-5h8v5M7 6.5h.01" />
        </svg>
      );
    case "landing":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M7 13h6M7 16h3M16 13l2 2-2 2" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <path d="M4 10v10h16V10M3 5h18l-1 5a3 3 0 0 1-5 1 3 3 0 0 1-6 0 3 3 0 0 1-5-1Z" />
          <path d="M9 20v-5h6v5" />
        </svg>
      );
    case "restaurant":
      return (
        <svg {...common}>
          <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3c-2 3-2 8 1 9v9M17 12h3V3c-2 0-3 4-3 9Z" />
        </svg>
      );
    case "platform":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 8h3v3H8zM15 8h1M15 11h2M8 16h8M8 14h5" />
        </svg>
      );
  }
}

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
    <>
      <section className="web section section--light section--light-d" id="web">
        <div className="container web__shell">
          <div className="web__intro reveal">
            <div className="web__intro-copy">
              <span className="section__label">02 · Qué desarrollamos</span>
              <h2 className="section__title">
                Tu negocio. Tu idea. <span>Tu página.</span>
              </h2>
              <p className="section__lead">
                Diseñamos y desarrollamos soluciones web adaptadas a las
                necesidades reales de cada negocio.
              </p>
            </div>

            <div className="web__device-scene">
              <span className="web__trace web__trace--one" />
              <span className="web__trace web__trace--two" />
              <img
                className="web__showcase-image"
                src="/web-development-showcase.jpg"
                alt="Diseño web gastronómico adaptable en laptop y teléfono"
                width={1024}
                height={682}
                loading="lazy"
                decoding="async"
              />
              <p className="web__idea-note">
                Tu idea,
                <br />
                en la web.
              </p>
            </div>
          </div>

          <div className="web__catalog">
            <h3 className="web__services-title reveal">Soluciones web</h3>
            <div className="web__grid">
              {services.map((service, index) => (
                <article key={service.title} className="web-card reveal">
                  <span className="web-card__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="web-card__icon">
                    <ServiceIcon type={service.icon} />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>
                </article>
              ))}
            </div>
          </div>

        </div>
      </section>

      <WebDevelopmentDetails onQuote={() => setOpen(true)} />

      {open &&
        createPortal(
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
                  <div
                    className="web-modal__choices web-modal__choices--budget"
                    role="radiogroup"
                  >
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
          </div>,
          document.body,
        )}
    </>
  );
}
