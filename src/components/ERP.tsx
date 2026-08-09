import "./ERP.css";

const modules = [
  "Finanzas",
  "Gestión de inventario",
  "Ventas",
  "Recursos humanos",
  "Producción",
  "Analítica",
  "Informes detallados",
  "IA integrada en el sistema",
];

const plans = [
  {
    name: "Esencial",
    price: "299",
    desc: "Para empresas que inician su control operativo.",
    featured: false,
    mineral: "plata",
    includes: [
      "Ventas",
      "Caja",
      "Clientes",
      "Reportes básicos",
      "1 sucursal",
      "Hasta 5 usuarios",
    ],
  },
  {
    name: "Crecimiento",
    price: "399",
    desc: "Para negocios que necesitan stock y compras.",
    featured: false,
    mineral: "platino",
    includes: [
      "Todo lo de Esencial",
      "Inventario",
      "Compras",
      "Facturación",
      "2 sucursales",
      "Hasta 15 usuarios",
    ],
  },
  {
    name: "Empresarial",
    price: "499",
    desc: "Para empresas con operación más completa.",
    featured: true,
    mineral: "oro",
    includes: [
      "Todo lo de Crecimiento",
      "Finanzas",
      "Reportes avanzados",
      "Hasta 5 sucursales",
      "Hasta 30 usuarios",
      "Soporte prioritario",
    ],
  },
  {
    name: "Corporativo",
    price: "599",
    desc: "Para organizaciones con alta complejidad.",
    featured: false,
    mineral: "diamante",
    includes: [
      "Todos los módulos ERP",
      "Sucursales ilimitadas",
      "Usuarios ilimitados",
      "Roles y permisos avanzados",
      "Integraciones a medida",
      "Soporte dedicado",
    ],
  },
];

export function ERP() {
  return (
    <>
      <section className="erp section section--blue section--blue-b" id="erp">
        <div className="container erp__shell">
          <div className="erp__grid">
            <div className="erp__content reveal">
              <div className="erp__heading">
                <span className="section__label">02 · ERP Fadey</span>
                <span className="erp__soon">Próximamente</span>
              </div>
              <h2 className="section__title">
                Gestión integral para empresas y negocios grandes
              </h2>
              <p className="section__lead">
                ERP Fadey centralizará y controlará las diferentes áreas de tu
                empresa desde una sola plataforma. Está en desarrollo; deja tus
                datos y te avisamos cuando esté listo. Planes desde{" "}
                <strong>S/ 299</strong> hasta <strong>S/ 599</strong> mensuales.
              </p>

              <a className="btn btn--ghost" href="#contacto">
                Quiero ser avisado
              </a>
            </div>

            <div className="erp__visual reveal" aria-hidden="true">
              <div className="erp-panel erp-panel--soon">
                <div className="erp-panel__bar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="erp-panel__body">
                  <div className="erp-panel__side">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="erp-panel__nav-item" />
                    ))}
                  </div>
                  <div className="erp-panel__main">
                    <div className="erp-panel__kpis">
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="erp-panel__table">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="erp-panel__soon-badge">Próximamente</div>
              </div>
            </div>
          </div>

          <div className="erp__modules" aria-label="Módulos de ERP Fadey">
            {modules.map((mod) => (
              <span key={mod} className="erp__chip">
                {mod}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="erp-plans section section--light section--light-b"
        id="erp-planes"
      >
        <div className="container">
          <div className="erp-plans__head reveal">
            <p className="erp-plans__soon">Próximamente</p>
            <h3>Planes ERP Fadey</h3>
            <p>
              Estamos construyendo cada plan. Déjanos tu contacto y te avisamos
              cuando ERP Fadey esté disponible.
            </p>
          </div>

          <div className="erp-plans__grid">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "erp-plan",
                  "plan-mineral",
                  `plan-mineral--${plan.mineral}`,
                  "reveal",
                  plan.featured ? "plan-mineral--featured" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="plan-mineral__shine" aria-hidden="true" />
                {plan.featured && (
                  <span className="erp-plan__badge">Más elegido</span>
                )}
                <h4>{plan.name}</h4>
                <p className="erp-plan__price">
                  <strong>S/ {plan.price}</strong>
                  <span>/mes</span>
                </p>
                <p className="erp-plan__desc">{plan.desc}</p>
                <ul className="erp-plan__list">
                  {plan.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a
                  className={`btn ${plan.mineral === "plata" || plan.mineral === "platino" ? "btn--dark" : "btn--solid-cyan"}`}
                  href="#contacto"
                >
                  Avisarme
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
