import { msgSoporte, waUrl } from "../lib/whatsapp";
import "./Maintenance.css";

const WHATSAPP_SOPORTE = waUrl(msgSoporte());

const fadeyPoints = [
  "Actualizaciones y corrección de errores",
  "Seguridad y copias de seguridad",
  "Soporte técnico y optimización",
  "Gestión del hosting",
];

const clientPoints = [
  "Desarrollo inicial a cargo de Fadey",
  "Entrega completa del proyecto",
  "Autonomía total de gestión",
  "Soporte posterior opcional bajo demanda",
];

function CheckIcon() {
  return (
    <svg
      className="maint-card__check"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Maintenance() {
  return (
    <section className="maint section section--light section--light-c" id="soporte">
      <div className="container">
        <div className="maint__intro reveal">
          <span className="section__label">04 · Soporte</span>
          <h2 className="section__title">Dos formas de cuidar tu proyecto</h2>
          <p className="section__lead">
            Después del lanzamiento, elige cómo quieres administrar tu sitio o
            plataforma. Ambos modelos están pensados para adaptarse a tu
            operación.
          </p>
        </div>

        <div className="maint__grid">
          <article className="maint-card maint-card--fadey reveal">
            <div className="maint-card__glow" aria-hidden="true" />
            <div className="maint-card__top">
              <div className="maint-card__icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="maint-card__badge">Recomendado</span>
            </div>
            <h3>Fadey se encarga</h3>
            <p className="maint-card__lead">
              Mantenimiento administrado por Fadey Solutions. Nosotros
              mantenemos, actualizamos y supervisamos tu sitio.
            </p>
            <ul>
              {fadeyPoints.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="maint-card__footer">
              <p className="maint-card__note">
                Costo según proyecto y alcance.
              </p>
              <a
                className="btn btn--primary"
                href={WHATSAPP_SOPORTE}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cotizar soporte Fadey
              </a>
            </div>
          </article>

          <article className="maint-card maint-card--client reveal">
            <div className="maint-card__glow" aria-hidden="true" />
            <div className="maint-card__top">
              <div className="maint-card__icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </div>
              <span className="maint-card__badge maint-card__badge--alt">
                Autogestión
              </span>
            </div>
            <h3>Tú administras</h3>
            <p className="maint-card__lead">
              Recibes tu proyecto y te encargas del mantenimiento y la
              administración.
            </p>
            <ul>
              {clientPoints.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="maint-card__footer">
              <p className="maint-card__note">
                El soporte puede contratarse de manera independiente.
              </p>
              <a
                className="btn btn--ghost maint-card__btn-alt"
                href={WHATSAPP_SOPORTE}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar soporte bajo demanda
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
