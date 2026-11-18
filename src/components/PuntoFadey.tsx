import { useEffect, useState } from "react";
import { goToSection } from "../lib/goToSection";
import {
  msgPuntoInfo,
  msgPuntoPlan,
  msgQuoteProduct,
  waUrl,
} from "../lib/whatsapp";
import "./PuntoFadey.css";

/** Vacío = demostración próximamente. Pegar URL de video cuando exista. */
const PUNTO_DEMO_VIDEO = "";

const puntoModuleTiles = [
  {
    label: "Venta rápida",
    desc: "Registro y cobro de productos",
    tone: "cyan" as const,
    how: "Arma el carrito desde el catálogo o el escáner, aplica descuentos permitidos y cobra en efectivo, tarjeta, transferencia o pagos combinados.",
  },
  {
    label: "Productos",
    desc: "Administración del catálogo",
    tone: "blue" as const,
    how: "Gestiona catálogo, categorías, marcas, unidades, presentaciones y listas de precios. Importa o exporta productos por CSV.",
  },
  {
    label: "Inventario",
    desc: "Existencias y movimientos",
    tone: "teal" as const,
    how: "Controla saldos, transferencias, ajustes, kardex y alertas de stock o vencimiento. El stock solo se mueve con operaciones registradas.",
  },
  {
    label: "Almacén",
    desc: "Gestión de productos y stock",
    tone: "navy" as const,
    how: "Organiza almacenes por sucursal, consulta stock por categoría y mueve mercadería entre ubicaciones con trazabilidad.",
  },
  {
    label: "Informes",
    desc: "Estadísticas y reportes",
    tone: "mint" as const,
    how: "Revisa ventas, compras, inventario, caja, rentabilidad y clientes. Exporta a Excel o PDF con datos reales del negocio.",
  },
  {
    label: "Código de barras",
    desc: "Lector y cámara del equipo",
    tone: "orange" as const,
    how: "Lee códigos con lectores USB o Bluetooth y con la cámara del dispositivo (EAN, UPC, Code 128/39 y más) en venta, productos e inventario.",
  },
  {
    label: "Caja",
    desc: "Control de operaciones y ventas",
    tone: "green" as const,
    how: "Abre la caja del día, registra ingresos y egresos, cierra turno y consulta el historial. La venta exige caja abierta de la misma sucursal.",
  },
  {
    label: "Facturación electrónica",
    desc: "Comprobantes electrónicos",
    tone: "violet" as const,
    how: "Emite boletas, facturas y notas con XML UBL 2.1, series y correlativos. El envío usa tu proveedor autorizado; la aceptación depende del CDR.",
  },
] as const;

const puntoTrustItems = [
  {
    title: "PC, tablet o celular",
    desc: "Trabaja desde cualquier dispositivo",
    icon: "cloud" as const,
  },
  {
    title: "Datos de tu negocio",
    desc: "Cada comercio ve solo su información",
    icon: "shield" as const,
  },
  {
    title: "Actualizaciones incluidas",
    desc: "El sistema evoluciona contigo",
    icon: "refresh" as const,
  },
  {
    title: "Soporte cuando lo necesitas",
    desc: "Acompañamiento real de Fadey",
    icon: "headset" as const,
  },
] as const;

const planTierDefs = [
  {
    id: "inicial",
    name: "Inicial",
    price: "70",
    accent: "blue" as const,
    icon: "rocket" as const,
    ribbon: null as string | null,
    featured: false,
    desc: "Para bodegas y tiendas que empiezan a digitalizar el mostrador",
    newModules: [
      "Venta rápida",
      "Catálogo de productos",
      "Caja (apertura, cobro y cierre)",
      "Historial de ventas",
    ],
  },
  {
    id: "basico",
    name: "Básico",
    price: "95",
    accent: "teal" as const,
    icon: "store" as const,
    ribbon: null,
    featured: false,
    desc: "Agrega escaneo e informes para agilizar el día a día",
    newModules: [
      "Códigos de barras (lector y cámara)",
      "Unidades y presentaciones",
      "Informes de ventas",
      "Devoluciones y anulaciones",
    ],
  },
  {
    id: "estandar",
    name: "Estándar",
    price: "120",
    accent: "cyan" as const,
    icon: "boxes" as const,
    ribbon: "Recomendado",
    featured: true,
    desc: "Control de stock y almacenes para minimarkets en crecimiento",
    newModules: [
      "Inventario y kardex",
      "Almacenes",
      "Transferencias y ajustes",
      "Alertas de stock",
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    price: "150",
    accent: "navy" as const,
    icon: "chart" as const,
    ribbon: null,
    featured: false,
    desc: "Clientes, crédito y compras para una operación más completa",
    newModules: [
      "Clientes",
      "Créditos y abonos",
      "Compras y proveedores",
      "Informes de compras e inventario",
    ],
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: "180",
    accent: "gold" as const,
    icon: "crown" as const,
    ribbon: "Más completo",
    featured: false,
    desc: "Facturación electrónica y control total del negocio",
    newModules: [
      "Facturación electrónica",
      "Informes completos con exportación",
      "Roles y permisos",
      "Multi-sucursal",
    ],
  },
] as const;

const puntoPlans = (() => {
  const accumulated: string[] = [];
  return planTierDefs.map((tier) => {
    accumulated.push(...tier.newModules);
    return {
      ...tier,
      allModules: [...accumulated],
    };
  });
})();

function PuntoModuleTileIcon({
  tone,
}: {
  tone: (typeof puntoModuleTiles)[number]["tone"];
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (tone) {
    case "cyan":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h6M7 12h10M7 15h4" />
        </svg>
      );
    case "blue":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M4 7h16v12H4z" />
          <path d="M8 7V5h8v2M8 11h8M8 15h5" />
        </svg>
      );
    case "teal":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M4 19V5M4 19h16" />
          <path d="M7 15l3-4 3 2 4-6" />
        </svg>
      );
    case "navy":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M3 19h18M5 19V9l7-4 7 4v10" />
          <path d="M9 19v-5h6v5" />
        </svg>
      );
    case "mint":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 16v-3M12 16V8M16 16v-5M8 6h8" />
        </svg>
      );
    case "orange":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M4 8h10v8H4z" />
          <path d="M14 10h3l3 2v2l-3 2h-3" />
          <circle cx="7.5" cy="12" r="1.2" />
        </svg>
      );
    case "green":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <rect x="3" y="9" width="18" height="11" rx="2" />
          <path d="M7 9V6h10v3M7 14h5M16 14h1M7 17h10" />
        </svg>
      );
    case "violet":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M7 4h10v16H7z" />
          <path d="M10 8h4M10 12h4M10 16h2" />
        </svg>
      );
    default:
      return null;
  }
}

function PuntoTrustIcon({
  kind,
}: {
  kind: (typeof puntoTrustItems)[number]["icon"];
}) {
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
        </svg>
      );
    case "headset":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <path d="M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2z" />
          <path d="M20 14a2 2 0 0 1-2 2h-1v-5h2a2 2 0 0 1 2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

function PuntoPlanIcon({
  kind,
}: {
  kind: (typeof planTierDefs)[number]["icon"];
}) {
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
    case "boxes":
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <path d="M3 8l9-4 9 4-9 4-9-4z" />
          <path d="M3 8v8l9 4 9-4V8" />
          <path d="M12 12v8" />
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

function PuntoBrandMark({ className }: { className?: string }) {
  return (
    <img
      className={className ?? "punto__brand-mark"}
      src="/punto-fadey-logo.jpg"
      alt="Punto Fadey"
      width={320}
      height={120}
      decoding="async"
    />
  );
}

export function PuntoFadey() {
  const [openModule, setOpenModule] = useState<
    (typeof puntoModuleTiles)[number] | null
  >(null);
  const hasDemoVideo = Boolean(PUNTO_DEMO_VIDEO.trim());

  useEffect(() => {
    if (!openModule) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenModule(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openModule]);

  return (
    <>
      <section
        className="punto-hero section section--light section--light-a"
        id="punto"
        aria-labelledby="punto-hero-title"
      >
        <div className="punto-hero__inner">
          <div className="punto-hero__shell">
            <div className="punto-hero__copy reveal">
              <div className="punto-hero__eyebrow">
                <div className="punto-hero__brand">
                  <PuntoBrandMark />
                  <span className="punto-hero__brand-name">Punto Fadey POS</span>
                </div>
                <p className="punto-hero__badge">
                  Sistema de punto de venta para comercios
                </p>
              </div>

              <h2 id="punto-hero-title" className="punto-hero__tagline">
                Tu tienda bajo control,{" "}
                <span className="punto-hero__tagline-accent">
                  desde un solo lugar
                </span>
              </h2>

              <p className="punto-hero__lead">
                Controla tu tienda desde un solo lugar. Gestiona tus ventas,
                productos, inventario y operaciones con una plataforma diseñada
                para simplificar el trabajo diario de tu negocio.
              </p>

              <div className="punto-hero__actions">
                <button
                  type="button"
                  className="btn punto-hero__cta punto-hero__cta--primary"
                  onClick={() => goToSection("#punto-demo")}
                >
                  Ver demostración
                </button>
                <button
                  type="button"
                  className="btn punto-hero__cta punto-hero__cta--ghost-light"
                  onClick={() => goToSection("#punto-planes")}
                >
                  Conocer los planes
                </button>
              </div>

              <ul className="punto-modules__grid" id="punto-funciones">
                {puntoModuleTiles.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className="punto-modules__tile"
                      aria-expanded={openModule?.label === item.label}
                      onClick={() => setOpenModule(item)}
                    >
                      <span
                        className={`punto-modules__tile-icon punto-modules__tile-icon--${item.tone}`}
                      >
                        <PuntoModuleTileIcon tone={item.tone} />
                      </span>
                      <span className="punto-modules__tile-text">
                        <span className="punto-modules__tile-label">
                          {item.label}
                        </span>
                        <span className="punto-modules__tile-desc">
                          {item.desc}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="punto-hero__visual reveal">
              <div className="punto-hero__visual-frame">
                <img
                  className="punto-hero__showcase"
                  src="/punto-fadey-showcase.jpg"
                  alt="Comerciante atendiendo en una bodega con laptop mostrando el sistema POS Punto Fadey"
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <ul className="punto-hero__trust reveal">
            {puntoTrustItems.map((item) => (
              <li key={item.title}>
                <span
                  className={`punto-hero__trust-icon punto-hero__trust-icon--${item.icon}`}
                >
                  <PuntoTrustIcon kind={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {openModule ? (
          <div
            className="punto-modules__detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="punto-module-detail-title"
            onClick={() => setOpenModule(null)}
          >
            <div
              className="punto-modules__detail-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="punto-modules__detail-copy">
                <span
                  className={`punto-modules__tile-icon punto-modules__tile-icon--${openModule.tone}`}
                >
                  <PuntoModuleTileIcon tone={openModule.tone} />
                </span>
                <h3 id="punto-module-detail-title">{openModule.label}</h3>
                <p className="punto-modules__detail-kicker">{openModule.desc}</p>
                <p>{openModule.how}</p>
                <button
                  type="button"
                  className="btn punto-hero__cta punto-hero__cta--primary"
                  onClick={() => setOpenModule(null)}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section
        className="punto-demo section section--light section--light-b"
        id="punto-demo"
        aria-labelledby="punto-demo-title"
      >
        <div className="container punto-demo__shell">
          <div className="punto-demo__grid">
            <div className="punto-demo__content reveal">
              <div className="punto-hero__brand punto-hero__brand--demo">
                <PuntoBrandMark className="punto__brand-mark punto__brand-mark--demo" />
                <span className="punto-hero__brand-name">Punto Fadey POS</span>
              </div>
              <p className="punto-demo__eyebrow">Demostración</p>
              <h2 id="punto-demo-title" className="punto-demo__title">
                Así funciona Punto Fadey
              </h2>
              <p className="punto-demo__lead">
                Te mostramos cómo registrar ventas, controlar inventario y
                cerrar caja en un flujo pensado para bodegas y minimarkets.
              </p>
              {hasDemoVideo ? (
                <a
                  className="btn punto-hero__cta punto-hero__cta--primary"
                  href={PUNTO_DEMO_VIDEO}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver video
                </a>
              ) : (
                <p className="punto-demo__soon-note">
                  Video demostrativo en preparación. Mientras tanto, revisa los
                  planes o escríbenos para una demo guiada.
                </p>
              )}
            </div>

            <div className="punto-demo__visual reveal">
              {hasDemoVideo ? (
                <div className="punto-demo__player">
                  <video
                    className="punto-demo__video"
                    src={PUNTO_DEMO_VIDEO}
                    controls
                    playsInline
                    preload="metadata"
                    poster="/punto-fadey-demo-poster.jpg"
                    width={560}
                    height={368}
                    aria-label="Video demostrativo de Punto Fadey"
                  >
                    Tu navegador no reproduce video.
                  </video>
                </div>
              ) : (
                <div
                  className="punto-demo__soon"
                  role="img"
                  aria-label="Demostración de Punto Fadey próximamente"
                >
                  <img
                    src="/punto-fadey-demo-poster.jpg"
                    alt=""
                    width={1600}
                    height={900}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="punto-demo__soon-overlay">
                    <span className="punto-demo__play" aria-hidden="true">
                      ▶
                    </span>
                    <strong>Demostración próximamente</strong>
                    <span>Estamos preparando el video oficial</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className="punto-plans section section--blue section--blue-a"
        id="punto-planes"
      >
        <div className="container punto-plans__inner">
          <header className="punto-plans__head reveal">
            <div className="punto-hero__brand punto-hero__brand--plans">
              <PuntoBrandMark className="punto__brand-mark punto__brand-mark--plans" />
              <span className="punto-hero__brand-name">Punto Fadey POS</span>
            </div>
            <h2 className="punto-plans__title">
              Planes mensuales para{" "}
              <em className="punto-plans__title-accent">tu comercio</em>
            </h2>
            <p className="punto-plans__lead">
              Cada plan conserva lo del anterior y suma módulos reales de Punto
              Fadey. Desde S/ 70 hasta S/ 180 al mes.
            </p>
          </header>

          <div className="punto-plans__grid reveal">
            {puntoPlans.map((plan, index) => (
              <article
                key={plan.id}
                className={[
                  "punto-plan-card",
                  `punto-plan-card--${plan.accent}`,
                  plan.featured ? "punto-plan-card--featured" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="punto-plan-card__top">
                  <span className="punto-plan-card__icon" aria-hidden="true">
                    <PuntoPlanIcon kind={plan.icon} />
                  </span>
                  {plan.ribbon ? (
                    <span className="punto-plan-card__ribbon">{plan.ribbon}</span>
                  ) : null}
                </div>
                <h3 className="punto-plan-card__name">{plan.name}</h3>
                <p className="punto-plan-card__desc">{plan.desc}</p>
                <p className="punto-plan-card__price">
                  <strong>S/ {plan.price}</strong>
                  <span>/mes</span>
                </p>
                {index > 0 ? (
                  <p className="punto-plan-card__includes">
                    Incluye todo lo anterior +
                  </p>
                ) : (
                  <p className="punto-plan-card__includes punto-plan-card__includes--base">
                    Módulos incluidos
                  </p>
                )}
                <ul className="punto-plan-card__list punto-plan-card__list--highlight">
                  {plan.newModules.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <details className="punto-plan-card__all">
                  <summary>
                    Ver todos los módulos ({plan.allModules.length})
                  </summary>
                  <ul className="punto-plan-card__list">
                    {plan.allModules.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
                <a
                  className="punto-plan-card__cta"
                  href={waUrl(msgPuntoPlan(plan.name, plan.price))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contratar plan
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  className="punto-plan-card__advise"
                  href={waUrl(msgPuntoInfo())}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solicitar asesoría
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="punto-close section section--light section--light-b"
        id="punto-cierre"
        aria-labelledby="punto-close-title"
      >
        <div className="container punto-close__inner reveal">
          <div className="punto-hero__brand punto-hero__brand--close">
            <PuntoBrandMark className="punto__brand-mark punto__brand-mark--close" />
            <span className="punto-hero__brand-name">Punto Fadey POS</span>
          </div>
          <h2 id="punto-close-title" className="punto-close__title">
            Tu negocio merece un mejor control. Empieza a gestionar tu tienda
            con Punto Fadey.
          </h2>
          <p className="punto-close__lead">
            Cotiza tu plan, escríbenos por WhatsApp o agenda una demostración
            guiada con el equipo de Fadey Solutions.
          </p>
          <div className="punto-close__actions">
            <a
              className="btn punto-hero__cta punto-hero__cta--primary"
              href={waUrl(msgQuoteProduct())}
              target="_blank"
              rel="noopener noreferrer"
            >
              Solicitar cotización
            </a>
            <a
              className="btn punto-hero__cta punto-hero__cta--ghost-light"
              href={waUrl(msgPuntoInfo())}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            <button
              type="button"
              className="btn punto-hero__cta punto-hero__cta--ghost-light"
              onClick={() => goToSection("#punto-demo")}
            >
              Ver demostración
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
