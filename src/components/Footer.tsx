import { mailtoInfo, msgQuoteProduct, waUrl } from "../lib/whatsapp";
import "./Footer.css";

const WHATSAPP_EMPTY = waUrl();
const WHATSAPP_QUOTE = waUrl(msgQuoteProduct());
const MAILTO_URL = mailtoInfo();

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <a href="#inicio" className="footer__logo">
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
            Tecnología que impulsa tu negocio. Resto Fadey, ERP Fadey,
            desarrollo web y soporte.
          </p>
        </div>

        <div>
          <h4>Soluciones</h4>
          <ul>
            <li>
              <a href="#resto">Resto Fadey</a>
            </li>
            <li>
              <a href="#erp">ERP Fadey</a>
            </li>
            <li>
              <a href="#web">Desarrollo web</a>
            </li>
            <li>
              <a href="#soporte">Soporte</a>
            </li>
          </ul>
        </div>

        <div>
          <h4>Empresa</h4>
          <ul>
            <li>
              <a href="#modelo">Nuestras soluciones</a>
            </li>
            <li>
              <a href="#contacto">Contacto</a>
            </li>
          </ul>
        </div>

        <div>
          <h4>Contacto</h4>
          <ul>
            <li>
              <a href={MAILTO_URL}>contacto@fadeysolutions.com</a>
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
      </div>
    </footer>
  );
}
