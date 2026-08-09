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

export function WebDevelopment() {
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
          <a className="btn btn--primary" href="#contacto">
            Solicitar proyecto web
          </a>
        </div>
      </div>
    </section>
  );
}
