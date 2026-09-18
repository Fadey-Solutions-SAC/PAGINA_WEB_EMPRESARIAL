import { msgErpNotify, msgSoporte, waUrl } from "../lib/whatsapp";
import "./SolutionsModel.css";

const offerings = [
  {
    eyebrow: "Resto Fadey",
    title: "Software para negocios gastronómicos",
    items: ["Pedidos y caja", "Cocina o barra", "Inventario"],
    meta: "Suscripción mensual",
    price: "Desde S/ 99/mes",
    href: "#resto",
    external: false,
    cta: "Ver Resto Fadey",
    icon: "resto",
    metaIcon: "user",
    soon: false,
  },
  {
    eyebrow: "ERP Fadey",
    title: "Gestión integral empresarial",
    items: ["Ventas y finanzas", "Inventario y compras", "Sucursales y usuarios"],
    meta: "En desarrollo",
    price: "Próximamente",
    href: waUrl(msgErpNotify()),
    external: true,
    cta: "Avisarme",
    icon: "erp",
    metaIcon: "rocket",
    soon: true,
  },
  {
    eyebrow: "Desarrollo web",
    title: "Páginas y plataformas a medida",
    items: ["Sitios empresariales", "E-commerce", "Landing pages"],
    meta: "Proyecto personalizado",
    price: "Desde S/ 500",
    href: "#web",
    external: false,
    cta: "Solicitar web",
    icon: "web",
    metaIcon: "code",
    soon: false,
  },
  {
    eyebrow: "Soporte",
    title: "Mantenimiento y acompañamiento",
    items: ["Actualizaciones", "Seguridad", "Soporte técnico"],
    meta: "Según alcance",
    price: "Cotización a medida",
    href: waUrl(msgSoporte()),
    external: true,
    cta: "Cotizar soporte",
    icon: "support",
    metaIcon: "people",
    soon: false,
  },
] as const;

function OfferIcon({ type }: { type: (typeof offerings)[number]["icon"] }) {
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
    case "resto":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      );
    case "erp":
      return (
        <svg {...common}>
          <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
        </svg>
      );
    case "web":
      return (
        <svg {...common}>
          <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <path d="M7 12c-1.5 0-3-1.2-3-3V7a2 2 0 0 1 4 0v5" />
          <path d="M17 12c1.5 0 3-1.2 3-3V7a2 2 0 0 0-4 0v5" />
          <path d="M8 12h8v3a4 4 0 0 1-8 0Z" />
        </svg>
      );
  }
}

function MetaIcon({ type }: { type: (typeof offerings)[number]["metaIcon"] }) {
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
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19c1.4-3 4-4.5 7-4.5S17.6 16 19 19" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M14 5c3-3 5-3 5-3s0 2-3 5l-5 5-4-4Z" />
          <path d="m9 10-4 1-3 3 6 1 1 6 3-3 1-4" />
        </svg>
      );
    case "code":
      return (
        <svg {...common}>
          <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c.8-3 3-4.5 6-4.5S14.2 16 15 19" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M16 19c.5-2 1.8-3.2 4-3.6" />
        </svg>
      );
  }
}

export function SolutionsModel() {
  return (
    <section className="model section section--light section--light-a" id="modelo">
      <div className="container">
        <div className="model__intro reveal">
          <span className="section__label">Nuestras soluciones</span>
          <h2 className="section__title">Lo que ofrecemos en Fadey Solutions</h2>
          <p className="section__lead">
            Soluciones tecnológicas completas para impulsar tu negocio. Desde la
            gestión diaria hasta el crecimiento digital, todo en un solo lugar.
          </p>
        </div>

        <div className="model__grid model__grid--four">
          {offerings.map((item) => (
            <article
              key={item.eyebrow}
              className={[
                "model-card",
                item.soon ? "model-card--soon" : "",
                "reveal",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="model-card__top">
                <span className="model-card__icon">
                  <OfferIcon type={item.icon} />
                </span>
                <p className="model-card__eyebrow">{item.eyebrow}</p>
                {item.soon && (
                  <span className="model-card__soon">Próximamente</span>
                )}
              </div>
              <h3>{item.title}</h3>
              <ul>
                {item.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="model-card__meta">
                <span>
                  <MetaIcon type={item.metaIcon} />
                  {item.meta}
                </span>
                <strong>{item.price}</strong>
              </div>
              <a
                className="model-card__cta"
                href={item.href}
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.cta}
                <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
