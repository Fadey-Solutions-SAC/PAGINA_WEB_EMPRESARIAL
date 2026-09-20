import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { msgWebInfo, waUrl } from "../lib/whatsapp";
import "./WebDevelopmentDetails.css";

const processSteps = [
  {
    number: "01",
    title: "Análisis",
    text: "Conocemos tu negocio, público y objetivo.",
    shape: "circle",
    timeValue: "3",
    timeLabel: "días",
  },
  {
    number: "02",
    title: "Estructura",
    text: "Definimos páginas, contenido y recorrido del usuario.",
    shape: "square",
    timeValue: "4",
    timeLabel: "días",
  },
  {
    number: "03",
    title: "Diseño",
    text: "Creamos una propuesta visual alineada con tu marca.",
    shape: "hex",
    timeValue: "7",
    timeLabel: "días",
  },
  {
    number: "04",
    title: "Desarrollo",
    text: "Construimos la web y adaptamos sus funciones.",
    shape: "diamond",
    timeValue: "2",
    timeLabel: "sem.",
  },
  {
    number: "05",
    title: "Lanzamiento",
    text: "Publicamos el proyecto y te acompañamos en la puesta en marcha.",
    shape: "octagon",
    timeValue: "2",
    timeLabel: "días",
  },
];

const includedItems = [
  {
    title: "Diseño adaptable",
    text: "Tu web se visualiza correctamente en celulares, tablets y computadoras.",
    icon: "devices",
  },
  {
    title: "Seguridad",
    text: "SSL y buenas prácticas para proteger tu proyecto.",
    icon: "shield",
  },
  {
    title: "Entrega y capacitación",
    text: "Te explicamos el funcionamiento y administración de tu sitio.",
    icon: "guide",
  },
] as const;

const investmentLevels = [
  { title: "Proyectos profesionales", price: "S/ 500", icon: "building" },
  { title: "Proyectos con mayor complejidad", price: "S/ 1,000", icon: "rocket" },
  {
    title: "Plataformas y soluciones avanzadas",
    price: "S/ 2,000+",
    icon: "layers",
  },
] as const;

function IncludedIcon({ type }: { type: (typeof includedItems)[number]["icon"] }) {
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
    case "devices":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="14" height="11" rx="2" />
          <path d="M7 20h6M10 15v5" />
          <rect x="17" y="9" width="4" height="10" rx="1" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m8.5 12 2.2 2.2 4.8-5" />
        </svg>
      );
    case "guide":
      return (
        <svg {...common}>
          <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22Z" />
          <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22Z" />
        </svg>
      );
  }
}

function InvestmentIcon({
  type,
}: {
  type: (typeof investmentLevels)[number]["icon"];
}) {
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
    case "building":
      return (
        <svg {...common}>
          <path d="M4 21V5l8-3v19M12 8h8v13M2 21h20" />
          <path d="M7 7h2M7 11h2M7 15h2M15 11h2M15 15h2M15 19h2" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M14 5c3-3 5-3 5-3s0 2-3 5l-5 5-4-4Z" />
          <path d="m9 10-4 1-3 3 6 1 1 6 3-3 1-4" />
          <circle cx="15" cy="6" r="1" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common}>
          <path d="m12 2 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
        </svg>
      );
  }
}

export function WebDevelopmentDetails({ onQuote }: { onQuote: () => void }) {
  const webInfoUrl = waUrl(msgWebInfo());
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerRef = useRef<{
    id: number | null;
    x: number;
    y: number;
    hold: number;
    captured: boolean;
  }>({ id: null, x: 0, y: 0, hold: 0, captured: false });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 920px)");
    let timer = 0;

    const startLoop = () => {
      window.clearInterval(timer);
      if (!mq.matches) {
        setActiveStep(0);
        setPaused(false);
        return;
      }
      if (paused) return;

      timer = window.setInterval(() => {
        setActiveStep((current) => (current + 1) % processSteps.length);
      }, 2800);
    };

    startLoop();
    mq.addEventListener("change", startLoop);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(pointerRef.current.hold);
      mq.removeEventListener("change", startLoop);
    };
  }, [paused]);

  function goToStep(index: number) {
    const total = processSteps.length;
    setActiveStep(((index % total) + total) % total);
  }

  function clearHold() {
    window.clearTimeout(pointerRef.current.hold);
    pointerRef.current.hold = 0;
  }

  function onStepPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(max-width: 920px)").matches === false) return;
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      hold: window.setTimeout(() => {
        setPaused(true);
      }, 280),
      captured: false,
    };
    setDragX(0);
  }

  function onStepPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current;
    if (pointer.id !== event.pointerId) return;

    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.captured && Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) {
      clearHold();
      return;
    }
    if (!pointer.captured && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      clearHold();
      pointer.captured = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      setPaused(true);
    }
    if (pointer.captured) {
      setDragX(dx);
    }
  }

  function finishPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current;
    if (pointer.id !== event.pointerId) return;
    clearHold();
    const dx = event.clientX - pointer.x;
    if (pointer.captured) {
      if (dx <= -40) goToStep(activeStep + 1);
      else if (dx >= 40) goToStep(activeStep - 1);
    }
    pointerRef.current = { id: null, x: 0, y: 0, hold: 0, captured: false };
    setDragging(false);
    setDragX(0);
  }

  return (
    <>
      <section
        className="web-process section section--blue section--blue-d"
        id="proceso-web"
      >
        <div className="container web-process__shell">
          <div className="web-process__intro reveal">
            <div className="web-process__intro-copy">
              <span className="section__label">Nuestro proceso</span>
              <h2 className="section__title">
                De tu idea a una web lista para crecer
              </h2>
              <p className="section__lead">
                Cada proyecto sigue un proceso claro. Tú conoces el avance y
                participas en las decisiones importantes antes de publicar.
              </p>
            </div>
          </div>

          <div
            className={`web-process__experience${dragging ? " is-dragging" : ""}${paused ? " is-paused" : ""}`}
            onPointerDown={onStepPointerDown}
            onPointerMove={onStepPointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
          >
            <ol
              className="web-process__steps"
              aria-label="Etapas del desarrollo web"
              data-active={activeStep}
              style={
                {
                  "--active-step": activeStep,
                  "--drag-x": `${dragX}px`,
                } as CSSProperties
              }
            >
              {processSteps.map((step, index) => (
                <li
                  className={`web-process-step reveal${index === activeStep ? " is-active" : ""}`}
                  key={step.number}
                >
                  <span className="web-process-step__node">
                    <span
                      className="web-process-step__ornament"
                      aria-hidden="true"
                    >
                      <i className="web-process-step__tick" />
                      <i className="web-process-step__bar" />
                      <i className="web-process-step__gem" />
                    </span>
                    <span
                      className={`web-process-step__number web-process-step__number--${step.shape}`}
                    >
                      <span>{step.number}</span>
                    </span>
                    <span className="web-process-step__time">
                      <strong>{step.timeValue}</strong>
                      <em>{step.timeLabel}</em>
                    </span>
                    <span
                      className="web-process-step__ornament web-process-step__ornament--end"
                      aria-hidden="true"
                    >
                      <i className="web-process-step__bar" />
                      <i className="web-process-step__tick" />
                    </span>
                  </span>
                  <div className="web-process-step__copy">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="web-process__progress reveal" role="tablist" aria-label="Pasos del proceso">
              {processSteps.map((step, index) => (
                <button
                  type="button"
                  key={step.number}
                  className={index === activeStep ? "is-on" : undefined}
                  aria-label={`Ir al paso ${step.number}: ${step.title}`}
                  aria-current={index === activeStep ? "step" : undefined}
                  onClick={() => {
                    setPaused(true);
                    goToStep(index);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="web-included web-process__included" id="incluye-web">
          <div className="web-included__intro reveal">
            <div>
              <span className="section__label">Tu proyecto incluye</span>
              <h2 className="section__title">
                Una web preparada para trabajar por tu negocio
              </h2>
            </div>
            <p className="section__lead">
              No entregamos solo una apariencia bonita. Construimos una base
              funcional, segura y preparada para representar tu marca.
            </p>
          </div>

          <div className="web-included__grid">
            {includedItems.map((item) => (
              <article className="web-included-card reveal" key={item.title}>
                <div className="web-included-card__icon">
                  <IncludedIcon type={item.icon} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="web-included__cta reveal">
            <div>
              <strong>Tu proyecto no termina con la publicación.</strong>
              <span>
                Recibes orientación, capacitación y opciones de soporte posterior.
              </span>
            </div>
            <a
              className="btn btn--primary"
              href={webInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cuéntanos tu proyecto
            </a>
          </div>
          </div>
        </div>
      </section>

      <section
        className="web-investment-section section section--light section--light-d"
        id="inversion-web"
      >
        <div className="container web-investment-section__shell">
          <div className="web-investment-section__head reveal">
            <span className="section__label">Inversión</span>
            <h2 className="section__title">
              Una solución adaptada a tu proyecto
            </h2>
            <p className="section__lead">
              Cada proyecto se cotiza según sus funcionalidades, alcance y
              necesidades.
            </p>
          </div>

          <div className="web-investment reveal">
            <div className="web-investment__levels">
              {investmentLevels.map((level) => (
                <article key={level.price}>
                  <div className="web-investment__card-head">
                    <span className="web-investment__card-icon">
                      <InvestmentIcon type={level.icon} />
                    </span>
                    <span>{level.title}</span>
                  </div>
                  <strong>
                    Desde <b>{level.price}</b>
                  </strong>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onQuote}
            >
              Solicitar cotización
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
