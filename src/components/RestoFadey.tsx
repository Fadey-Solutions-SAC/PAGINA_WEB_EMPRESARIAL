import { RestoDemo, restoDemoModules } from "./RestoDemo";
import "./RestoFadey.css";

const WHATSAPP_DEMO_URL =
  "https://wa.me/51921028316?text=" +
  encodeURIComponent(
    "Hola Fadey Solutions, quiero solicitar una demostración de Resto Fadey para mi negocio gastronómico. Me interesa ver cómo funciona la plataforma (pedidos, caja, cocina/barra e inventario).",
  );

const audience = [
  "Restaurantes",
  "Bares",
  "Pollerías",
  "Pastelerías",
  "Heladerías",
];

const benefits = [
  "Control en tiempo real",
  "Pedidos y ventas",
  "Inventario inteligente",
  "Cocina y Bar",
  "Reportes de tu negocio",
  "Soporte especializado",
];

const plans = [
  {
    id: "basico",
    name: "Básico",
    tag: "Para iniciar tu negocio",
    price: "99",
    accent: "neutral" as const,
    desc: "Ideal para locales que empiezan a digitalizar su operación diaria.",
    modulesLabel: "Módulos incluidos",
    modules: [
      "Pedidos y mesas — control de salón",
      "Menú digital — carta actualizable",
      "Caja básica — cobros del día",
      "Reportes del día — cierre operativo",
      "Almacén e inventario básico",
      "Hasta 5 usuarios",
    ],
    also: [
      "Capacitación para administrador, cajeros y meseros",
      "Acceso multiplataforma",
      "Soporte en horario laboral",
    ],
  },
  {
    id: "intermedio",
    name: "Intermedio",
    tag: "Para locales ya establecidos",
    price: "199",
    accent: "cyan" as const,
    desc: "Para negocios con más operación que necesitan control en vivo.",
    modulesLabel: "Incluye todo el Plan Básico, más:",
    modules: [
      "Inventario inteligente — alertas y stock",
      "Funcionamiento en vivo — salón, cocina y bar",
      "Clientes y fidelización",
      "Reportes de ventas detallados",
      "Control de turnos",
      "Hasta 12 usuarios",
    ],
    also: [
      "Multiusuario, roles y permisos por área",
      "Control en tiempo real de tu negocio",
      "Soporte prioritario por WhatsApp y email",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tag: "Para negocios que quieren ser top",
    price: "299",
    accent: "gold" as const,
    desc: "Operación completa con inteligencia y automatización para escalar.",
    promo: "S/ 249 por contrato semestral · 15 cupos · Pídelo ya",
    promoPill: "S/ 249/mes · contrato 6 meses",
    modulesLabel: "Incluye todo el Plan Intermedio, más:",
    modules: [
      "Alertas inteligentes — stock, caja y demanda",
      "Automatización operativa — reportes sin fricción",
      "Control operativo unificado del turno",
      "Análisis de datos — KPIs y tendencias",
      "Asistencia administrativa inteligente",
      "Hasta 15 usuarios",
    ],
    also: [
      "Todos los módulos operativos de Resto Fadey",
      "Capacitación personalizada para tu equipo",
      "Control total desde un solo panel",
      "Soporte priorizado por WhatsApp, email y atención",
    ],
  },
];

export function RestoFadey() {
  return (
    <>
      <section className="resto section section--blue section--blue-a" id="resto">
        <div className="container resto__shell">
          <div className="resto__grid">
            <div className="resto__content reveal">
              <div className="resto__brand">
                <img
                  className="resto__brand-mark"
                  src="/resto-fadey-mark.png"
                  alt="Resto-FADEY"
                  width={200}
                  height={45}
                  decoding="async"
                />
              </div>
              <h2 className="section__title">
                Controla todo tu negocio gastronómico desde un solo lugar
              </h2>
              <p className="section__lead">
                Gestiona pedidos, caja, cocina o barra e inventario en una sola
                plataforma. Automatiza tu operación, reduce errores y decide con
                información en tiempo real.
              </p>
              <ul
                className="resto__audience"
                aria-label="Tipos de negocio compatibles con Resto Fadey"
              >
                {audience.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="resto__offer">
                Planes desde <strong>S/ 99</strong> al mes · Sin complicaciones ·
                Listo para empezar
              </p>
              <ul className="resto__benefits" aria-label="Beneficios de Resto Fadey">
                {benefits.map((item) => (
                  <li key={item}>
                    <span aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="resto__visual reveal">
              <div className="resto-shot">
                <div className="resto-shot__bar">
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <p className="resto-shot__tagline">
                    No te lo contamos, te lo mostramos. Interactúa con el
                    sistema
                  </p>
                </div>
                <RestoDemo />
              </div>
              <div className="resto__cta">
                <a className="btn btn--primary" href="#resto-planes">
                  Ver planes y beneficios
                </a>
                <a
                  className="btn btn--ghost"
                  href={WHATSAPP_DEMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solicitar una demostración
                </a>
              </div>
            </div>
          </div>

          <div className="resto__modules" aria-label="Módulos de Resto Fadey">
            {restoDemoModules.map((mod) => (
              <span key={mod} className="resto__chip">
                {mod}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="resto-plans section section--light section--light-a"
        id="resto-planes"
      >
        <div className="container">
          <div className="resto-plans__head reveal">
            <h3>Planes Resto Fadey</h3>
            <p>
              Cada plan incluye más módulos y capacidad según el tamaño de tu
              negocio gastronómico.
            </p>
          </div>

          <div className="resto-plans__grid">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={[
                  "resto-plan",
                  `resto-plan--${plan.accent}`,
                  "reveal",
                  "promo" in plan && plan.promo ? "resto-plan--has-promo" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="resto-plan__tag">{plan.tag}</span>
                {"promo" in plan && plan.promo && (
                  <div
                    className="resto-plan__promo"
                    aria-label="Promoción Premium"
                  >
                    <svg
                      className="resto-plan__promo-neon"
                      viewBox="0 0 160 64"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        className="resto-plan__promo-neon-flow"
                        pathLength="100"
                        d="M 10 1.5 H 150 A 8 8 0 0 1 158.5 9.5 V 54.5 A 8 8 0 0 1 150 62.5 H 10 A 8 8 0 0 1 1.5 54.5 V 9.5 A 8 8 0 0 1 10 1.5 Z"
                      />
                    </svg>
                    <span>S/ 249 por contrato semestral</span>
                    <span>15 cupos disponibles · Pídelo ya</span>
                  </div>
                )}
                <div className="resto-plan__body">
                  <h4>{plan.name}</h4>
                  <p className="resto-plan__price">
                    <strong>S/ {plan.price}</strong>
                    <span>/mes</span>
                  </p>
                  {"promoPill" in plan && plan.promoPill && (
                    <span className="resto-plan__pill">{plan.promoPill}</span>
                  )}
                  <p className="resto-plan__desc">{plan.desc}</p>
                  <p className="resto-plan__modules-label">{plan.modulesLabel}</p>
                  <ul className="resto-plan__list">
                    {plan.modules.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="resto-plan__also">
                    <p>También incluye</p>
                    <ul>
                      {plan.also.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="resto-plan__scroll-hint" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <a className="resto-plan__cta" href="#contacto">
                  Empezar ahora
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
