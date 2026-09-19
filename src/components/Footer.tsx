import { Link } from "react-router-dom";
import { goToSection } from "../lib/goToSection";
import { mailtoInfo, msgQuoteProduct, waUrl } from "../lib/whatsapp";
import { ERP_FADEY_PUBLIC } from "../lib/products";
import "./Footer.css";

const WHATSAPP_EMPTY = waUrl();
const WHATSAPP_QUOTE = waUrl(msgQuoteProduct());
const MAILTO_URL = mailtoInfo();

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <a
            href="/#inicio"
            className="footer__logo"
            onClick={(e) => {
              if (window.location.pathname !== "/") return;
              e.preventDefault();
              goToSection("#inicio");
            }}
          >
            <span className="footer__mark">
              <img
                src="/logo-fadey.png"
                alt=""
                width={36}
                height={36}
                decoding="async"
              />
            </span>
            <span>
              Fadey <em>Solutions</em>
            </span>
          </a>
          <p>
            {ERP_FADEY_PUBLIC
              ? "Tecnología que impulsa tu negocio. Resto Fadey, ERP Fadey, desarrollo web y soporte."
              : "Tecnología que impulsa tu negocio. Resto Fadey, desarrollo web y soporte."}
          </p>
        </div>

        <div>
          <h4>Soluciones</h4>
          <ul>
            <li>
              <a
                href="/#resto"
                onClick={(e) => {
                  if (window.location.pathname !== "/") return;
                  e.preventDefault();
                  goToSection("#resto");
                }}
              >
                Resto Fadey
              </a>
            </li>
            {ERP_FADEY_PUBLIC ? (
            <li>
              <a
                href="/#erp"
                onClick={(e) => {
                  if (window.location.pathname !== "/") return;
                  e.preventDefault();
                  goToSection("#erp");
                }}
              >
                ERP Fadey
              </a>
            </li>
            ) : null}
            <li>
              <a
                href="/#web"
                onClick={(e) => {
                  if (window.location.pathname !== "/") return;
                  e.preventDefault();
                  goToSection("#web");
                }}
              >
                Desarrollo web
              </a>
            </li>
            <li>
              <a
                href="/#soporte"
                onClick={(e) => {
                  if (window.location.pathname !== "/") return;
                  e.preventDefault();
                  goToSection("#soporte");
                }}
              >
                Soporte
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4>Empresa</h4>
          <ul>
            <li>
              <a href="/#modelo">Nuestras soluciones</a>
            </li>
            <li>
              <a href="/#contacto">Contacto</a>
            </li>
            <li>
              <Link to="/libro-de-reclamaciones">Libro de reclamaciones</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Contacto</h4>
          <ul>
            <li>
              <a href={MAILTO_URL}>
                fadeysolutions@gmail.com
              </a>
            </li>
            <li>
              <a
                href={WHATSAPP_EMPTY}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={WHATSAPP_QUOTE}
                target="_blank"
                rel="noopener noreferrer"
              >
                Solicitar cotización
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>
          © {new Date().getFullYear()} Fadey Solutions S.A.C. Todos los derechos
          reservados.
        </p>
        <Link className="footer__legal" to="/libro-de-reclamaciones">
          Libro de reclamaciones
        </Link>
      </div>
    </footer>
  );
}
