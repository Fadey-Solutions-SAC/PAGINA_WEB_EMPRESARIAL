import { useEffect, useId, useState } from "react";
import { goToSection } from "../lib/goToSection";
import { ERP_FADEY_PUBLIC } from "../lib/products";
import "./Hero.css";

const exploreOptions = [
  {
    id: "resto",
    title: "Resto Fadey",
    desc: "Software para negocios gastronómicos",
    href: "#resto",
    image: "/explore-resto.jpg",
  },
  {
    id: "web",
    title: "Desarrollo web",
    desc: "Páginas y plataformas a medida",
    href: "#web",
    image: "/explore-web.jpg",
  },
  {
    id: "soporte",
    title: "Soporte",
    desc: "Mantenimiento y acompañamiento",
    href: "#soporte",
    image: "/explore-soporte.jpg",
  },
  {
    id: "contacto",
    title: "Contacto",
    desc: "Cotización y asesoría directa",
    href: "#contacto",
    image: "/explore-contacto.jpg",
  },
] as const;

function ExploreIcon({ id }: { id: (typeof exploreOptions)[number]["id"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };

  switch (id) {
    case "resto":
      return <span className="hero-explore__rf">RF</span>;
    case "web":
      return (
        <svg {...common}>
          <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" />
        </svg>
      );
    case "soporte":
      return (
        <svg {...common}>
          <path d="M4.5 13.5v-1.5a7.5 7.5 0 0 1 15 0v1.5" />
          <rect x="3.5" y="13" width="3.8" height="5.5" rx="1.4" />
          <rect x="16.7" y="13" width="3.8" height="5.5" rx="1.4" />
          <path d="M18.6 18.5c0 1.6-1.6 2.5-4.6 2.5" />
        </svg>
      );
    case "contacto":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
          <path d="m4.5 7 7.5 6 7.5-6" />
        </svg>
      );
  }
}

const businessRoutes = [
  {
    id: "resto",
    title: "Gestionar mi negocio",
    desc: "Resto Fadey para restaurantes y negocios gastronómicos.",
    href: "#resto",
    accent: "green",
  },
  {
    id: "erp",
    title: "Digitalizar mi empresa",
    desc: "ERP y sistemas empresariales personalizados.",
    href: "#erp",
    accent: "blue",
  },
  {
    id: "web",
    title: "Crear mi página web",
    desc: "Webs profesionales que convierten visitantes en clientes.",
    href: "#web",
    accent: "purple",
  },
  {
    id: "soporte",
    title: "Necesito soporte tecnológico",
    desc: "Mantenimiento, mejoras y asistencia para tus sistemas.",
    href: "#soporte",
    accent: "orange",
  },
] as const;

const heroFeatures = [
  { id: "pos", label: "Puntos de venta (POS)", href: "#resto" },
  { id: "web", label: "Desarrollo web", href: "#web" },
  {
    id: "gestion",
    label: "Gestión de negocios",
    href: ERP_FADEY_PUBLIC ? "#erp" : "#resto",
  },
  { id: "medida", label: "Soluciones a medida", href: "#contacto" },
] as const;

const heroStats = [
  { id: "adaptado", value: "100%", label: "Soluciones a medida" },
  { id: "satisfaccion", value: "98%", label: "Satisfacción" },
  { id: "soporte", value: "Soporte", label: "especializado" },
] as const;

const heroTrust = [
  { id: "restaurantes", label: "Restaurantes" },
  { id: "cafeterias", label: "Cafeterías" },
  { id: "pizzerias", label: "Pizzerías" },
  { id: "fastfood", label: "Fast Food" },
  { id: "cevicherias", label: "Cevicherías" },
] as const;

type HeroIconName =
  | (typeof heroFeatures)[number]["id"]
  | (typeof heroStats)[number]["id"]
  | (typeof heroTrust)[number]["id"]
  | "calendar"
  | "play";

function HeroIcon({ name }: { name: HeroIconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };

  switch (name) {
    case "pos":
      return (
        <svg {...common}>
          <path d="M4 9.5 5.6 4h12.8L20 9.5" />
          <path d="M4 9.5a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0 2.67 2.67 0 0 0 5.33 0" />
          <path d="M5.2 12v8h13.6v-8M10 20v-4.5h4V20" />
        </svg>
      );
    case "web":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="12" rx="1.8" />
          <path d="M8 20h8M12 16.5V20M10.2 8.6 8.4 10.5l1.8 1.9M13.8 8.6l1.8 1.9-1.8 1.9" />
        </svg>
      );
    case "gestion":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
        </svg>
      );
    case "medida":
      return (
        <svg {...common}>
          <path d="M4 20V14M9.3 20V10.5M14.6 20V12.5M20 20V6" />
          <path d="M3 20.5h18" />
        </svg>
      );
    case "adaptado":
      return (
        <svg {...common}>
          <path d="M12 3.2 19 6v5.4c0 4.4-2.9 7.8-7 9.4-4.1-1.6-7-5-7-9.4V6Z" />
          <path d="m8.8 12.1 2.2 2.2 4.3-4.5" />
        </svg>
      );
    case "satisfaccion":
      return (
        <svg {...common}>
          <path d="m12 3.4 2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.7l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85Z" />
        </svg>
      );
    case "soporte":
      return (
        <svg {...common}>
          <path d="M4.5 13.5V12a7.5 7.5 0 0 1 15 0v1.5" />
          <rect x="3.5" y="13" width="4" height="5.5" rx="1.4" />
          <rect x="16.5" y="13" width="4" height="5.5" rx="1.4" />
          <path d="M18.5 18.5c0 1.4-1.6 2.2-4.5 2.2" />
        </svg>
      );
    case "restaurantes":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 7v4.2a1.4 1.4 0 0 0 2.8 0V7M10.4 12.6V17M14.8 17V7c1.4.6 2 2.2 2 4s-.8 2.6-2 2.6" />
        </svg>
      );
    case "cafeterias":
      return (
        <svg {...common}>
          <path d="M4 10h12.5v4.5a5 5 0 0 1-5 5h-2.5a5 5 0 0 1-5-5Z" />
          <path d="M16.5 11.5h1.3a2.2 2.2 0 0 1 0 4.4h-1.6M8 4.5c-.6.8.6 1.6 0 2.5M11.2 4.5c-.6.8.6 1.6 0 2.5M3 21h15" />
        </svg>
      );
    case "pizzerias":
      return (
        <svg {...common}>
          <path d="M4.2 6.2c5.2-2.6 10.4-2.6 15.6 0L12 21Z" />
          <path d="M5.6 9c4.2-2 8.6-2 12.8 0" />
          <circle cx="10" cy="11.6" r="1" />
          <circle cx="13.6" cy="14" r="1" />
          <circle cx="12.4" cy="9.8" r=".6" />
        </svg>
      );
    case "fastfood":
      return (
        <svg {...common}>
          <path d="M4 10.5a8 6 0 0 1 16 0Z" />
          <path d="M3.5 13.2h17M4.4 16h15.2a2.6 2.6 0 0 1-2.6 3H7a2.6 2.6 0 0 1-2.6-3Z" />
          <path d="M9 7.6h.01M12 6.6h.01M15 7.6h.01" />
        </svg>
      );
    case "cevicherias":
      return (
        <svg {...common}>
          <path d="M3 15.5h18M5 15.5a7 7 0 0 1 14 0M12 8.5V7M10.8 7h2.4M4 19h16" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
          <path d="M8 3.5v3M16 3.5v3M3.5 10h17M8 14h.01M12 14h.01M16 14h.01" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m10 8.6 5 3.4-5 3.4Z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export function Hero() {
  const [exploreOpen, setExploreOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!exploreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExploreOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [exploreOpen]);

  function pickExplore(href: string) {
    setExploreOpen(false);
    window.requestAnimationFrame(() => goToSection(href));
  }

  return (
    <section className="hero" id="inicio">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__glow hero__glow--a" aria-hidden="true" />
      <div className="hero__glow hero__glow--b" aria-hidden="true" />

      <div className="hero__layout">
        <div className="hero__stage">
          <div className="hero__copy">
            <h1 className="hero__title">
              Tecnología que <span className="hero__title-accent">potencia</span>{" "}
              tu negocio
            </h1>
            <p className="hero__lead">
              Sistemas de gestión, desarrollo web y soluciones digitales diseñadas
              para optimizar, automatizar y hacer crecer tu negocio.
            </p>
          </div>

          <ul className="hero__features">
            {heroFeatures.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="hero__feature"
                  onClick={() => goToSection(item.href)}
                >
                  <span className="hero__feature-icon">
                    <HeroIcon name={item.id} />
                  </span>
                  <span className="hero__feature-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="hero__visual">
            <img
              className="hero__promo"
              src="/hero-resto-laptop.jpg"
              alt="Encargado usando Resto Fadey en su laptop dentro de un restaurante"
              width={1024}
              height={768}
              decoding="async"
            />
          </div>

          <div className="hero__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => goToSection("#contacto")}
            >
              <HeroIcon name="calendar" />
              Solicitar una cotización
              <span className="hero__btn-chevron" aria-hidden="true">
                ›
              </span>
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setExploreOpen(true)}
            >
              <HeroIcon name="play" />
              Ver nuestras soluciones
            </button>
          </div>

          <ul className="hero__stats">
            {heroStats.map((stat) => (
              <li key={stat.id} className={`hero__stat hero__stat--${stat.id}`}>
                <HeroIcon name={stat.id} />
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>

          <div className="hero__trust">
            <p className="hero__trust-title">Negocios que ya confían en nosotros</p>
            <ul>
              {heroTrust.map((item) => (
                <li key={item.id}>
                  <span className="hero__trust-icon">
                    <HeroIcon name={item.id} />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hero__routes">
          <h2 className="hero__routes-title">¿Qué necesitas para tu negocio?</h2>
          <div
            className={`hero__routes-grid${ERP_FADEY_PUBLIC ? "" : " hero__routes-grid--3"}`}
          >
            {businessRoutes
              .filter((route) => ERP_FADEY_PUBLIC || route.id !== "erp")
              .map((route) => (
              <a
                key={route.id}
                className={`hero__route hero__route--${route.accent}`}
                href={route.href}
                onClick={(e) => {
                  e.preventDefault();
                  goToSection(route.href);
                }}
              >
                <span className="hero__route-dot" aria-hidden="true" />
                <h3 className="hero__route-title">{route.title}</h3>
                <p className="hero__route-desc">{route.desc}</p>
                <span className="hero__route-cta">Conocer solución →</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {exploreOpen && (
        <div
          className="hero-explore"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="hero-explore__backdrop"
            aria-label="Cerrar"
            onClick={() => setExploreOpen(false)}
          />
          <div className="hero-explore__panel">
            <header className="hero-explore__head">
              <div className="hero-explore__brand">
                <img src="/logo-fadey.png" alt="" width={40} height={40} />
                <span>
                  Fadey <em>Solutions</em> SAC
                </span>
              </div>
              <button
                type="button"
                className="hero-explore__close"
                onClick={() => setExploreOpen(false)}
                aria-label="Cerrar"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            <div className="hero-explore__intro">
              <p className="hero-explore__eyebrow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m15.5 8.5-2 5-5 2 2-5z" />
                </svg>
                Explorar
              </p>
              <h2 id={titleId}>
                ¿Qué deseas{" "}
                <span className="hero-explore__accent">explorar</span>?
              </h2>
              <p>
                Elige una opción y te llevamos a la sección correspondiente.
              </p>
            </div>
            <div className="hero-explore__grid">
              {exploreOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="hero-explore__option"
                  onClick={() => pickExplore(opt.href)}
                >
                  <img
                    className="hero-explore__media"
                    src={opt.image}
                    alt=""
                    width={1024}
                    height={576}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="hero-explore__icon">
                    <ExploreIcon id={opt.id} />
                  </span>
                  <span className="hero-explore__text">
                    <strong>{opt.title}</strong>
                    <span>{opt.desc}</span>
                  </span>
                  <span className="hero-explore__chevron" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m10 7 5 5-5 5" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
