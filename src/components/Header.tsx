import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const links = [
  { href: "/#resto", label: "Resto Fadey" },
  { href: "/#erp", label: "ERP Fadey" },
  { href: "/#web", label: "Desarrollo Web" },
  { href: "/#soporte", label: "Soporte" },
  { href: "/#contacto", label: "Contacto" },
];

const WHATSAPP_RESTO_URL =
  "https://wa.me/51921028316?text=" +
  encodeURIComponent(
    "Hola Fadey Solutions, quiero solicitar el servicio de Resto Fadey para mi negocio gastronómico. ¿Me pueden brindar más información?",
  );

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`header ${scrolled ? "header--scrolled" : ""}`}>
      <div className="container header__inner">
        <Link to="/" className="header__logo" aria-label="Fadey Solutions SAC">
          <span className="header__mark">
            <img
              src="/logo-fadey.png"
              alt=""
              width={40}
              height={40}
              decoding="async"
            />
          </span>
          <span className="header__brand">
            Fadey <em>Solutions</em> SAC
          </span>
        </Link>

        <nav className={`header__nav ${open ? "is-open" : ""}`} aria-label="Principal">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link
            className="btn btn--ghost header__cta-mobile"
            to="/login"
            onClick={() => setOpen(false)}
          >
            Acceder
          </Link>
          <a
            className="btn btn--whatsapp header__cta-mobile"
            href={WHATSAPP_RESTO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            WhatsApp
          </a>
          <a
            className="btn btn--primary header__cta-mobile"
            href="/#contacto"
            onClick={() => setOpen(false)}
          >
            Solicitar cotización
          </a>
        </nav>

        <div className="header__actions">
          <Link className="btn btn--ghost header__access" to="/login">
            Acceder
          </Link>
          <a
            className="btn btn--whatsapp header__whatsapp"
            href={WHATSAPP_RESTO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              />
            </svg>
            WhatsApp
          </a>
          <a className="btn btn--primary header__cta" href="/#contacto">
            Solicitar cotización
          </a>
        </div>

        <button
          className={`header__toggle ${open ? "is-open" : ""}`}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
