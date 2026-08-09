import "./Hero.css";

const intents = [
  {
    id: "resto",
    label: "Necesito Resto Fadey para mi negocio gastronómico",
    href: "#resto",
  },
  {
    id: "erp",
    label: "Quiero ERP Fadey para mi empresa",
    href: "#erp",
  },
  {
    id: "web",
    label: "Quiero una página web para mi negocio",
    href: "#web",
  },
  {
    id: "soporte",
    label: "Necesito mantenimiento y soporte",
    href: "#soporte",
  },
];

export function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__glow hero__glow--a" aria-hidden="true" />
      <div className="hero__glow hero__glow--b" aria-hidden="true" />

      <div className="container hero__layout">
        <div className="hero__grid">
          <div className="hero__content">
            <p className="hero__brand">Fadey Solutions S.A.C.</p>
            <h1 className="hero__title">
              Tecnología que <span>impulsa</span> tu negocio
            </h1>
            <p className="hero__desc">
              Ofrecemos Resto Fadey, ERP Fadey, desarrollo web y soporte para
              gestionar, crecer y transformar tu empresa con tecnología clara y
              lista para operar.
            </p>

            <div className="hero__actions">
              <a className="btn btn--primary" href="#resto">
                Explorar soluciones
              </a>
              <a className="btn btn--ghost" href="#contacto">
                Solicitar cotización
              </a>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="laptop">
              <div className="laptop__lid">
                <div className="laptop__lid-edge" />
                <div className="laptop__bezel">
                  <span className="laptop__camera" />
                  <div className="laptop__display">
                    <div className="laptop__glow-screen" />
                    <div className="dash__top">
                      <div className="dash__avatar" />
                      <div className="dash__meta">
                        <span />
                        <span />
                      </div>
                      <div className="dash__pills">
                        <i />
                        <i />
                      </div>
                    </div>
                    <div className="dash__kpis">
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="dash__row">
                      <div className="dash__bars">
                        <i style={{ height: "42%" }} />
                        <i style={{ height: "68%" }} />
                        <i style={{ height: "55%" }} />
                        <i style={{ height: "82%" }} />
                        <i style={{ height: "48%" }} />
                        <i style={{ height: "72%" }} />
                        <i style={{ height: "60%" }} />
                      </div>
                      <div className="dash__ring">
                        <svg viewBox="0 0 36 36">
                          <path
                            d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
                            fill="none"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.5a15.5 15.5 0 1 1 0 31"
                            fill="none"
                            stroke="#00CFFF"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="60 100"
                          />
                        </svg>
                        <strong>86%</strong>
                      </div>
                    </div>
                    <div className="dash__chart">
                      <svg viewBox="0 0 200 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient
                            id="chartFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#00CFFF"
                              stopOpacity="0.35"
                            />
                            <stop
                              offset="100%"
                              stopColor="#00CFFF"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 60 C30 55, 40 30, 70 35 S110 55, 140 28 S170 20, 200 30 V80 H0 Z"
                          fill="url(#chartFill)"
                        />
                        <path
                          d="M0 60 C30 55, 40 30, 70 35 S110 55, 140 28 S170 20, 200 30"
                          fill="none"
                          stroke="#7DEBFF"
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="laptop__hinge" />
              <div className="laptop__deck">
                <div className="laptop__keyboard" />
                <div className="laptop__trackpad" />
              </div>
              <div className="laptop__bottom" />
              <div className="laptop__shadow" />
            </div>
          </div>
        </div>

        <div className="hero__intent">
          <p className="hero__intent-label">¿Qué estás buscando?</p>
          <div className="hero__intent-list" role="list">
            {intents.map((item) => (
              <a
                key={item.id}
                className="hero__intent-item"
                href={item.href}
                role="listitem"
              >
                <svg
                  className="hero__intent-neon"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    className="hero__intent-neon-flow"
                    pathLength="100"
                    d="M 9 1 H 91 A 8 8 0 0 1 99 9 V 31 A 8 8 0 0 1 91 39 H 9 A 8 8 0 0 1 1 31 V 9 A 8 8 0 0 1 9 1 Z"
                  />
                </svg>
                <span className="hero__intent-dot" aria-hidden="true" />
                <span className="hero__intent-text">{item.label}</span>
                <span className="hero__intent-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
