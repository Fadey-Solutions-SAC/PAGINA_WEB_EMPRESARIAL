import { useRef } from "react";
import { goToSection } from "../lib/goToSection";
import { msgRestoPlan, waUrl } from "../lib/whatsapp";
import "./RestoFadey.css";

const restoModuleTiles = [
  { label: "Caja", desc: "Ventas rápidas y seguras", tone: "orange" as const },
  { label: "Mesas", desc: "Control de comensales", tone: "blue" as const },
  { label: "Cocina", desc: "Órdenes en tiempo real", tone: "purple" as const },
  { label: "Bar", desc: "Bebidas y pedidos", tone: "pink" as const },
  { label: "Delivery", desc: "Pedidos a domicilio", tone: "mint" as const },
  { label: "Reservas", desc: "Agenda tu salón", tone: "green" as const },
  { label: "Clientes", desc: "Fideliza comensales", tone: "violet" as const },
  { label: "Reportes", desc: "Decisiones con datos", tone: "teal" as const },
] as const;

const restoTrustItems = [
  {
    title: "Acceso desde cualquier dispositivo",
    desc: "PC, tablet o celular",
    icon: "cloud" as const,
  },
  {
    title: "Seguro y confiable",
    desc: "Tu información siempre protegida",
    icon: "shield" as const,
  },
  {
    title: "Actualizaciones constantes",
    desc: "Siempre un paso adelante",
    icon: "refresh" as const,
  },
  {
    title: "Soporte 24/7",
    desc: "Estamos para ayudarte cuando lo necesites",
    icon: "headset" as const,
  },
] as const;

function RestoModuleTileIcon({ tone }: { tone: (typeof restoModuleTiles)[number]["tone"] }) {
  const d: Record<(typeof restoModuleTiles)[number]["tone"], string> = {
    orange: "M6 4h12v4H6zm0 6h8v2H6zm0 4h10v2H6z",
    blue: "M4 6h16v12H4zm2 2v8h12V8zm2 2h8v4h-8z",
    purple: "M8 3h8l2 4v14H6V7zm1 4h10v2H9zm0 4h7v2H9z",
    pink: "M8 4h8l2 3v13H6V7zm2 5h6v2h-6zm0 3h4v2h-4z",
    mint: "M4 8h16v10H4zm2 2v6h12v-6zm3-6h6l2 3H7z",
    green: "M7 3h10v4H7zm-2 6h14v12H5zm3 2v8h8V11z",
    violet: "M12 4a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm-6 14a6 6 0 0 1 12 0H6z",
    teal: "M6 4h12v3H6zm0 5h12v11H6zm2 2v7h8V11z",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d[tone]} fill="currentColor" />
    </svg>
  );
}

function RestoTrustIcon({ kind }: { kind: (typeof restoTrustItems)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.85,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "cloud":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M7 18h10a3 3 0 0 0 .3-6 4.5 4.5 0 0 0-8.8-1.5A3.25 3.25 0 0 0 7 18z" />
          <path d="M8 15h8" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M12 3 5 6v6c0 4.2 2.8 8.1 7 9 4.2-.9 7-4.8 7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M20 12a8 8 0 1 1-2.1-5.4" />
          <path d="M20 4v5h-5" />
          <path d="M4 12a8 8 0 1 1 2.1 5.4" />
          <path d="M4 20v-5h5" />
        </svg>
      );
    case "headset":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <path d="M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2z" />
          <path d="M20 14a2 2 0 0 1-2 2h-1v-5h2a2 2 0 0 1 2 2z" />
          <path d="M12 20v-2" />
        </svg>
      );
    default:
      return null;
  }
}

const whyFadeyCards = [
  {
    n: "01",
    accent: "green" as const,
    titleBefore: "Soluciones hechas para ",
    titleAccent: "tu negocio",
    desc: "Analizamos tu operación y diseñamos sistemas que encajan con tu forma real de trabajar.",
    bullets: [
      "Sistemas personalizados",
      "Escucha y asesoría real",
      "Enfoque en tus objetivos",
    ],
    icon: "target" as const,
  },
  {
    n: "02",
    accent: "blue" as const,
    titleBefore: "Tecnología ",
    titleAccent: "moderna",
    desc: "Usamos las herramientas actuales para que tu negocio sea eficiente, rápido y escalable.",
    bullets: [
      "Desarrollo web y mobile",
      "Sistemas en la nube",
      "Diseño moderno y responsive",
    ],
    icon: "chip" as const,
  },
  {
    n: "03",
    accent: "purple" as const,
    titleBefore: "Acompañamiento ",
    titleAccent: "real",
    desc: "No te entregamos el sistema y desaparecemos. Te acompañamos en implementación y operación.",
    bullets: [
      "Capacitación incluida",
      "Soporte técnico constante",
      "Mejoras y actualizaciones",
    ],
    icon: "support" as const,
  },
  {
    n: "04",
    accent: "orange" as const,
    titleBefore: "Un solo equipo ",
    titleAccent: "tecnológico",
    desc: "Desarrollo, soporte, mantenimiento y evolución de tus soluciones con un mismo equipo.",
    bullets: [
      "Equipo especializado",
      "Comunicación directa",
      "Compromiso a largo plazo",
    ],
    icon: "team" as const,
  },
] as const;

function WhyFadeyIcon({ kind }: { kind: (typeof whyFadeyCards)[number]["icon"] }) {
  const paths: Record<(typeof whyFadeyCards)[number]["icon"], string> = {
    target:
      "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm0-13a5 5 0 1 0 5 5 5 5 0 0 0-5-5Z",
    chip: "M9 3h6l1 2h3v14H5V5h3Zm-1 4v10h8V7Zm2 2h4v2h-4Zm0 3h4v2h-4Z",
    support:
      "M12 2a7 7 0 0 0-7 7v3a3 3 0 0 0 3 3h1v-5H7V9a5 5 0 0 1 10 0v1h-2v5h1a3 3 0 0 0 3-3V9a7 7 0 0 0-7-7Zm-1 14h2v3h-2Z",
    team: "M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c2.2 0 4 1.2 4 3v2H14v-2c0-1.2 1.8-3 4-3ZM4 16c0-1.8 1.8-3 4-3s4 1.2 4 3v2H4Z",
  };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d={paths[kind]} />
    </svg>
  );
}

const planTierDefs = [
  {
    id: "basico",
    name: "Básico",
    price: "99",
    accent: "blue" as const,
    icon: "rocket" as const,
    ribbon: null as string | null,
    featured: false,
    desc: "Para negocios que empiezan a digitalizar su operación",
    newModules: ["Escritorio", "Caja", "Mesas", "Productos"],
  },
  {
    id: "emprendedor",
    name: "Emprendedor",
    price: "149",
    accent: "green" as const,
    icon: "store" as const,
    ribbon: null,
    featured: false,
    desc: "Todo lo del Plan Básico, más herramientas para mejorar la operación",
    newModules: ["Cocina", "Bar", "Inventario", "Gastos"],
  },
  {
    id: "profesional",
    name: "Profesional",
    price: "199",
    accent: "purple" as const,
    icon: "chef" as const,
    ribbon: "Más popular",
    featured: true,
    desc: "Para negocios que necesitan mayor control y organización",
    newModules: ["Clientes", "Proveedores", "Ofertas", "Descuentos"],
  },
  {
    id: "negocio",
    name: "Negocio",
    price: "249",
    accent: "orange" as const,
    icon: "chart" as const,
    ribbon: null,
    featured: false,
    desc: "Para negocios con una operación más completa y mayores necesidades de gestión",
    newModules: ["Delivery", "Reservas", "Pedido QR", "Crédito"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "299",
    accent: "gold" as const,
    icon: "crown" as const,
    ribbon: "Mejor valor",
    featured: false,
    desc: "La solución completa para gestionar y controlar todo tu negocio",
    newModules: [
      "Informes",
      "Ventas",
      "Indicadores",
      "Mi restaurante",
      "Facturación electrónica",
      "Pago por sistema",
      "Tiempo trabajado",
    ],
  },
] as const;

const restoPlans = (() => {
  const accumulated: string[] = [];
  return planTierDefs.map((tier) => {
    accumulated.push(...tier.newModules);
    return {
      ...tier,
      allModules: [...accumulated],
    };
  });
})();

function RestoPlanIcon({ kind }: { kind: (typeof planTierDefs)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "rocket":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M12 15l-3 5 3-1 3 1-3-5z" />
          <path d="M12 15V9" />
          <path d="M8 11c-2-4-1-8 4-8s6 4 4 8" />
        </svg>
      );
    case "store":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M4 10h16V8l-2-4H6L4 8z" />
          <path d="M6 10v10h12V10" />
          <path d="M10 14h4" />
        </svg>
      );
    case "chef":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M6 11h12c0-3-1.5-5-4-5-1.2 0-2.2.5-3 1.3C10.2 6.5 9.2 6 8 6 5.5 6 4 8 4 11z" />
          <path d="M6 11v2h12v-2" />
          <path d="M8 13v5h8v-5" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M4 19h16" />
          <path d="M7 16V9" />
          <path d="M12 16V6" />
          <path d="M17 16v-4" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M5 17h14l-1-9-4 4-2-5-2 5-4-4z" />
          <path d="M5 17v2h14v-2" />
        </svg>
      );
    default:
      return null;
  }
}

export function FadeyWhy() {
  return (
    <section
      className="fadey-why section section--light section--light-b"
      id="fadey-por-que"
      aria-labelledby="fadey-why-title"
    >
      <div className="fadey-why__shell">
        <div className="fadey-why__intro reveal">
          <p className="fadey-why__eyebrow">→ ¿Por qué elegir Fadey Solutions?</p>
          <h2 id="fadey-why-title" className="fadey-why__headline">
            Más que tecnología,{" "}
            <span className="fadey-why__headline-accent">
              somos tu aliado de crecimiento.
            </span>
          </h2>
          <p className="fadey-why__lead">
            En Fadey Solutions no solo desarrollamos sistemas y páginas web:
            creamos soluciones reales para que tu negocio sea más eficiente,
            competitivo y esté siempre un paso adelante.
          </p>
        </div>

        <div className="fadey-why__visual reveal">
          <div className="fadey-why__dashboard-wrap">
            <span
              className="fadey-why__ia-badge"
              title="Inteligencia artificial Fadey"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
                <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              IA Fadey
            </span>
            <img
              className="fadey-why__dashboard"
              src="/fadey-why-dashboard.jpg?v=1"
              alt="Resto Fadey en tablet: reportes, ventas, métodos de pago e indicadores del negocio"
              width={1024}
              height={768}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="fadey-why__cards">
          {whyFadeyCards.map((card) => (
            <article
              key={card.n}
              className={`fadey-why-card fadey-why-card--${card.accent} reveal`}
            >
              <div className="fadey-why-card__icon">
                <WhyFadeyIcon kind={card.icon} />
              </div>
              <span className="fadey-why-card__num" aria-hidden="true">
                {card.n}
              </span>
              <h3 className="fadey-why-card__title">
                {card.titleBefore}
                <em>{card.titleAccent}</em>
              </h3>
              <p className="fadey-why-card__desc">{card.desc}</p>
              <ul className="fadey-why-card__list">
                {card.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RestoIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const playDemo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.scrollIntoView({ behavior: "smooth", block: "center" });
    void video.play();
  };

  return (
    <section className="resto section section--light section--light-a" id="resto">
      <div className="container resto__shell">
        <div className="resto__grid">
          <div className="resto__content reveal">
            <div className="resto__brand">
              <img
                className="resto__brand-banner resto__brand-banner--blue"
                src="/resto-fadey-banner-blue.png"
                alt="Resto Fadey"
                width={904}
                height={209}
                decoding="async"
              />
            </div>
            <p className="resto__commercial-eyebrow">
              Así funciona Resto Fadey
            </p>
            <h2 className="section__title">
              Tu negocio, conectado en un solo sistema.
            </h2>
            <p className="section__lead resto__commercial-copy">
              Te mostramos cómo funciona Resto Fadey y cómo puedes simplificar
              la gestión de tu negocio gastronómico. Conoce su funcionamiento,
              sus principales herramientas y la forma en que cada área de tu
              operación trabaja de manera integrada.
            </p>
            <button
              type="button"
              className="btn btn--primary resto__commercial-play"
              onClick={playDemo}
            >
              <span aria-hidden="true">▶</span>
              Ver cómo funciona
            </button>
          </div>

          <div className="resto__visual reveal">
            <div className="resto-shot resto-shot--video">
              <video
                ref={videoRef}
                className="resto-shot__video"
                src="/resto-fadey-demo.mp4?v=2"
                controls
                playsInline
                preload="metadata"
                width={560}
                height={368}
                aria-label="Video explicativo de Resto Fadey"
              >
                Tu navegador no reproduce video.{" "}
                <a href="/resto-fadey-demo.mp4">Descarga el video</a>.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RestoFadey() {
  return (
    <>
      <section
        className="resto-modules section section--blue section--blue-a resto-modules--theme-green"
        id="resto-modulos"
        aria-labelledby="resto-modules-title"
      >
        <div className="resto-modules__inner">
          <div className="resto-modules__shell">
          <div className="resto-modules__copy reveal">
            <div className="resto-modules__eyebrow">
              <img
                className="resto__brand-banner resto__brand-banner--green"
                src="/resto-fadey-banner-green.png"
                alt="Resto Fadey"
                width={904}
                height={210}
                decoding="async"
              />
            </div>

            <h2 id="resto-modules-title" className="resto-modules__tagline">
              Todo tu negocio{" "}
              <span className="resto-modules__tagline-accent">gastronómico</span>{" "}
              desde un solo lugar
            </h2>

            <p className="resto-modules__lead">
              Controla ventas, mesas, cocina, inventario y delivery desde una
              sola plataforma fácil de usar. Organiza tu local, mejora tiempos
              de atención y toma decisiones con reportes en tiempo real.
            </p>

            <ul className="resto-modules__grid">
              {restoModuleTiles.map((item) => (
                <li key={item.label}>
                  <span
                    className={`resto-modules__tile-icon resto-modules__tile-icon--${item.tone}`}
                  >
                    <RestoModuleTileIcon tone={item.tone} />
                  </span>
                  <span className="resto-modules__tile-label">{item.label}</span>
                  <span className="resto-modules__tile-desc">{item.desc}</span>
                </li>
              ))}
            </ul>

            <div className="resto-modules__actions">
              <button
                type="button"
                className="btn resto-modules__cta resto-modules__cta--primary"
                onClick={() => goToSection("#resto")}
              >
                Ver Resto Fadey
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="btn resto-modules__cta resto-modules__cta--ghost"
                onClick={() => goToSection("#fadey-por-que")}
              >
                <span className="resto-modules__cta-info" aria-hidden="true">
                  i
                </span>
                Conocer más
              </button>
            </div>
          </div>

          <div className="resto-modules__visual reveal">
            <img
              className="resto-modules__showcase"
              src="/resto-modulos-devices.jpg?v=3"
              alt="Resto Fadey en monitor y celular: panel de ventas, menú y pedidos móviles"
              width={1024}
              height={682}
              loading="lazy"
              decoding="async"
            />
          </div>
          </div>

          <ul className="resto-modules__trust reveal">
            {restoTrustItems.map((item) => (
              <li key={item.title}>
                <span
                  className={`resto-modules__trust-icon resto-modules__trust-icon--${item.icon}`}
                >
                  <RestoTrustIcon kind={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RestoIntro />

      <section
        className="resto-plans section section--blue section--blue-b"
        id="resto-planes"
      >
        <div className="container resto-plans__inner">
          <header className="resto-plans__head reveal">
            <img
              className="resto__brand-banner resto__brand-banner--purple resto-plans__brand-banner"
              src="/resto-fadey-banner-purple.png"
              alt="Resto Fadey"
              width={904}
              height={204}
              decoding="async"
            />
            <h2 className="resto-plans__title">
              Elige el plan ideal para{" "}
              <em className="resto-plans__title-accent">tu negocio</em>
            </h2>
            <p className="resto-plans__lead">
              Cada plan conserva todos los módulos del anterior y suma nuevos.
              Compara con claridad y elige según el tamaño de tu operación.
            </p>
          </header>

          <div className="resto-plans__grid reveal">
            {restoPlans.map((plan, index) => (
              <article
                key={plan.id}
                className={[
                  "resto-plan-card",
                  `resto-plan-card--${plan.accent}`,
                  plan.featured ? "resto-plan-card--featured" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="resto-plan-card__top">
                  <span className="resto-plan-card__icon" aria-hidden="true">
                    <RestoPlanIcon kind={plan.icon} />
                  </span>
                  {plan.ribbon ? (
                    <span className="resto-plan-card__ribbon">{plan.ribbon}</span>
                  ) : null}
                </div>
                <h3 className="resto-plan-card__name">{plan.name}</h3>
                <p className="resto-plan-card__desc">{plan.desc}</p>
                <p className="resto-plan-card__price">
                  <strong>S/ {plan.price}</strong>
                  <span>/mes</span>
                </p>
                {index > 0 ? (
                  <p className="resto-plan-card__includes">
                    Incluye todo lo anterior +
                  </p>
                ) : (
                  <p className="resto-plan-card__includes resto-plan-card__includes--base">
                    Módulos incluidos
                  </p>
                )}
                <ul className="resto-plan-card__list resto-plan-card__list--highlight">
                  {plan.newModules.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <details className="resto-plan-card__all">
                  <summary>
                    Ver todos los módulos ({plan.allModules.length})
                  </summary>
                  <ul className="resto-plan-card__list">
                    {plan.allModules.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
                <a
                  className="resto-plan-card__cta"
                  href={waUrl(msgRestoPlan(plan.name, plan.price))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Elegir plan
                  <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>

          <ul className="resto-plans__trust reveal">
            {restoTrustItems.map((item) => (
              <li key={item.title}>
                <span
                  className={`resto-plans__trust-icon resto-plans__trust-icon--${item.icon}`}
                >
                  <RestoTrustIcon kind={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
