import "./SolutionsModel.css";

const offerings = [
  {
    eyebrow: "Resto Fadey",
    title: "Software para negocios gastronómicos",
    items: ["Pedidos y caja", "Cocina o barra", "Inventario"],
    meta: "Suscripción mensual",
    price: "Desde S/ 99/mes",
    href: "#resto",
    cta: "Ver Resto Fadey",
    variant: "software",
    soon: false,
  },
  {
    eyebrow: "ERP Fadey",
    title: "Gestión integral empresarial",
    items: ["Ventas y finanzas", "Inventario y compras", "Sucursales y usuarios"],
    meta: "En desarrollo",
    price: "Próximamente",
    href: "#erp",
    cta: "Próximamente",
    variant: "software",
    soon: true,
  },
  {
    eyebrow: "Desarrollo web",
    title: "Páginas y plataformas a medida",
    items: ["Sitios empresariales", "E-commerce", "Landing pages"],
    meta: "Proyecto personalizado",
    price: "Desde S/ 500",
    href: "#web",
    cta: "Solicitar web",
    variant: "custom",
    soon: false,
  },
  {
    eyebrow: "Soporte",
    title: "Mantenimiento y acompañamiento",
    items: ["Actualizaciones", "Seguridad", "Soporte técnico"],
    meta: "Según alcance",
    price: "Cotización a medida",
    href: "#soporte",
    cta: "Ver soporte",
    variant: "custom",
    soon: false,
  },
];

export function SolutionsModel() {
  return (
    <section className="model section section--blue section--blue-c" id="modelo">
      <div className="container">
        <div className="model__intro reveal">
          <span className="section__label">Nuestras soluciones</span>
          <h2 className="section__title">Lo que ofrecemos en Fadey Solutions</h2>
        </div>

        <div className="model__grid model__grid--four">
          {offerings.map((item) => (
            <article
              key={item.eyebrow}
              className={[
                "model-card",
                `model-card--${item.variant}`,
                item.soon ? "model-card--soon" : "",
                "reveal",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="model-card__top">
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
                <span>{item.meta}</span>
                <strong>{item.price}</strong>
              </div>
              <a
                className={`btn ${item.soon ? "btn--ghost" : item.variant === "software" ? "btn--primary" : "btn--ghost"}`}
                href={item.href}
              >
                {item.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
