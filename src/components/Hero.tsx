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
  },
  {
    id: "web",
    title: "Desarrollo web",
    desc: "Páginas y plataformas a medida",
    href: "#web",
  },
  {
    id: "soporte",
    title: "Soporte",
    desc: "Mantenimiento y acompañamiento",
    href: "#soporte",
  },
  {
    id: "contacto",
    title: "Contacto",
    desc: "Cotización y asesoría directa",
    href: "#contacto",
  },
];

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
              Tecnología que <span>potencia</span> tu negocio
            </h1>
            <p className="hero__lead">
              Sistemas, páginas web y soluciones digitales diseñadas para hacer
              crecer tu empresa.
            </p>
            <p className="hero__desc">
              Desde la gestión de tu negocio hasta tu presencia en internet,
              desarrollamos soluciones profesionales adaptadas a lo que
              realmente necesitas.
            </p>
          </div>

          <div className="hero__visual">
            <img
              className="hero__promo"
              src="/resto-lifestyle.png"
              alt="Resto Fadey en operación: panel de gestión en un restaurante real"
              width={1200}
              height={800}
              decoding="async"
            />
          </div>

          <div className="hero__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => goToSection("#contacto")}
            >
              Solicitar una cotización
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setExploreOpen(true)}
            >
              Ver nuestras soluciones
            </button>
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
              <div>
                <p className="hero-explore__eyebrow">Explorar</p>
                <h2 id={titleId}>¿Qué deseas explorar?</h2>
                <p>
                  Elige una opción y te llevamos a la sección correspondiente.
                </p>
              </div>
              <button
                type="button"
                className="hero-explore__close"
                onClick={() => setExploreOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>
            <div className="hero-explore__grid">
              {exploreOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="hero-explore__option"
                  onClick={() => pickExplore(opt.href)}
                >
                  <strong>{opt.title}</strong>
                  <span>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
