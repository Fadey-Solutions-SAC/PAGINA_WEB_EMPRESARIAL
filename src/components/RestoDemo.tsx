import { useEffect, useState } from "react";
import "./RestoDemo.css";

type ModuleId =
  | "escritorio"
  | "caja"
  | "mesas"
  | "cocina"
  | "bar"
  | "clientes"
  | "almacen"
  | "inventario"
  | "informes"
  | "config";

const navItems: { id: ModuleId; label: string; icon: string }[] = [
  { id: "escritorio", label: "Escritorio", icon: "▣" },
  { id: "caja", label: "Caja", icon: "◫" },
  { id: "mesas", label: "Mesas", icon: "▦" },
  { id: "cocina", label: "Cocina", icon: "♨" },
  { id: "bar", label: "Bar", icon: "◈" },
  { id: "clientes", label: "Clientes", icon: "◎" },
  { id: "almacen", label: "Almacenes", icon: "▤" },
  { id: "inventario", label: "Inventario", icon: "▥" },
  { id: "informes", label: "Informes", icon: "◔" },
  { id: "config", label: "Configuración", icon: "⚙" },
];

/** Chips del detalle (Inventario no va aparte aquí). */
export const restoDemoModules = [
  "Escritorio",
  "Caja",
  "Mesas",
  "Cocina",
  "Bar",
  "Clientes",
  "Almacenes e inventario",
  "Informes",
  "Integración IA",
  "y más",
];

const chartPoints = [
  { t: "Lun", h: 48 },
  { t: "Mar", h: 62 },
  { t: "Mié", h: 55 },
  { t: "Jue", h: 78 },
  { t: "Vie", h: 92 },
  { t: "Sáb", h: 88 },
  { t: "Dom", h: 70 },
];

const aiAlerts = [
  {
    title: "Sin stock",
    text: "Cerveza Pilsen 355ml: 0 und. Solo se alerta stock en bebidas envasadas.",
  },
  {
    title: "Stock bajo",
    text: "Vino tinto reserva: quedan 4 botellas. Reabastece antes del finde.",
  },
  {
    title: "Hora punta",
    text: "17:00–19:00: proyectamos +22% de pedidos vs ayer.",
  },
  {
    title: "Mesa lenta",
    text: "Mesa 8 lleva 42 min ocupada. Sugiere cierre o postre.",
  },
];

function AiAlerts({
  open,
  onToggle,
  index,
}: {
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const alert = aiAlerts[index % aiAlerts.length];

  return (
    <div className="resto-demo__ai">
      <button
        type="button"
        className="resto-demo__ai-btn"
        onClick={onToggle}
        aria-expanded={open}
        aria-label="Alertas de IA del sistema"
      >
        <span className="resto-demo__ai-dot" aria-hidden="true" />
        IA
        <em>{aiAlerts.length}</em>
      </button>
      {open && (
        <div className="resto-demo__ai-panel" role="status">
          <header>
            <strong>Integración IA</strong>
            <span>Alertas del sistema</span>
          </header>
          <p>
            <b>{alert.title}</b>
            {alert.text}
          </p>
          <ul>
            {aiAlerts.map((a) => (
              <li key={a.title}>
                <span>{a.title}</span>
                {a.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EscritorioView({
  aiOpen,
  onToggleAi,
  aiIndex,
}: {
  aiOpen: boolean;
  onToggleAi: () => void;
  aiIndex: number;
}) {
  return (
    <div className="resto-demo__view resto-demo__view--resumen resto-demo__view--open">
      <header className="resto-demo__head">
        <div>
          <h3>Escritorio</h3>
          <p>Vista general de tus ventas y operaciones.</p>
        </div>
        <AiAlerts open={aiOpen} onToggle={onToggleAi} index={aiIndex} />
      </header>

      <div className="resto-demo__ai-banner" role="status">
        <span>IA</span>
        <p>
          <strong>Alerta:</strong> Cerveza Pilsen sin stock · Hora punta en 40
          min
        </p>
      </div>

      <div className="resto-demo__chart-card">
        <div className="resto-demo__chart-head">
          <strong>Gráfica de ventas</strong>
          <div className="resto-demo__chart-controls">
            <span className="resto-demo__date">02/03/2026 - 08/03/2026</span>
            <div className="resto-demo__tabs" role="tablist">
              <button type="button" className="is-active">
                Semana
              </button>
              <button type="button">Mes</button>
              <button type="button">Todos</button>
            </div>
          </div>
        </div>
        <div className="resto-demo__chart" aria-hidden="true">
          {chartPoints.map((p) => (
            <div key={p.t} className="resto-demo__bar-col">
              <div className="resto-demo__bar-track">
                <div
                  className="resto-demo__bar"
                  style={{ height: `${p.h}%` }}
                />
              </div>
              <small>{p.t}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="resto-demo__kpis">
        <article>
          <span>Efectivo</span>
          <strong>S/ 15,434</strong>
        </article>
        <article>
          <span>Tarjeta</span>
          <strong>S/ 9,839</strong>
        </article>
        <article>
          <span>Yape/Plin</span>
          <strong>S/ 11,784</strong>
        </article>
        <article>
          <span>Total</span>
          <strong>S/ 37,058</strong>
        </article>
      </div>
    </div>
  );
}

function CajaView() {
  const rows = [
    { id: "V-1042", mesa: "Mesa 4", total: "S/ 128.50", estado: "Pagado" },
    { id: "V-1043", mesa: "Mesa 12", total: "S/ 86.00", estado: "Pagado" },
    { id: "V-1044", mesa: "Mostrador", total: "S/ 54.90", estado: "Pendiente" },
    { id: "V-1045", mesa: "Mesa 7", total: "S/ 210.00", estado: "Pagado" },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Caja</h3>
          <p>Cobros, tickets y cierre de turno.</p>
        </div>
        <span className="resto-demo__badge">Hoy · 48 tickets</span>
      </header>
      <div className="resto-demo__kpis resto-demo__kpis--3">
        <article>
          <span>En caja</span>
          <strong>S/ 4,820</strong>
        </article>
        <article>
          <span>Ticket promedio</span>
          <strong>S/ 100.40</strong>
        </article>
        <article>
          <span>Pendientes</span>
          <strong>3</strong>
        </article>
      </div>
      <div className="resto-demo__table">
        <div className="resto-demo__tr resto-demo__tr--head">
          <span>Ticket</span>
          <span>Origen</span>
          <span>Total</span>
          <span>Estado</span>
        </div>
        {rows.map((r) => (
          <div key={r.id} className="resto-demo__tr">
            <span>{r.id}</span>
            <span>{r.mesa}</span>
            <span>{r.total}</span>
            <span
              className={
                r.estado === "Pagado"
                  ? "resto-demo__tag resto-demo__tag--ok"
                  : "resto-demo__tag resto-demo__tag--warn"
              }
            >
              {r.estado}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function MesasView() {
  const mesas = [
    { name: "Mesa 1", estado: "Libre", personas: "—" },
    { name: "Mesa 3", estado: "Ocupada", personas: "4" },
    { name: "Mesa 8", estado: "Cuenta", personas: "2" },
    { name: "Mesa 12", estado: "Ocupada", personas: "6" },
    { name: "Terraza 2", estado: "Libre", personas: "—" },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Mesas</h3>
          <p>Estado del salón en tiempo real.</p>
        </div>
        <span className="resto-demo__badge">18 mesas</span>
      </header>
      <div className="resto-demo__kpis resto-demo__kpis--3">
        <article>
          <span>Libres</span>
          <strong>7</strong>
        </article>
        <article>
          <span>Ocupadas</span>
          <strong>9</strong>
        </article>
        <article>
          <span>Cuenta</span>
          <strong>2</strong>
        </article>
      </div>
      <div className="resto-demo__table">
        <div className="resto-demo__tr resto-demo__tr--head">
          <span>Mesa</span>
          <span>Estado</span>
          <span>Personas</span>
          <span></span>
        </div>
        {mesas.map((m) => (
          <div key={m.name} className="resto-demo__tr">
            <span>{m.name}</span>
            <span
              className={
                m.estado === "Libre"
                  ? "resto-demo__tag resto-demo__tag--ok"
                  : m.estado === "Cuenta"
                    ? "resto-demo__tag resto-demo__tag--warn"
                    : "resto-demo__tag resto-demo__tag--bad"
              }
            >
              {m.estado}
            </span>
            <span>{m.personas}</span>
            <span />
          </div>
        ))}
      </div>
    </>
  );
}

function CocinaView() {
  const orders = [
    { mesa: "Mesa 3", items: "2 platos · 1 guarnición", min: "4 min", estado: "En prep." },
    { mesa: "Mesa 8", items: "1 menú ejecutivo", min: "11 min", estado: "Listo" },
    { mesa: "Mostrador", items: "Combo familiar", min: "7 min", estado: "En prep." },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Cocina</h3>
          <p>Cola de preparación y tiempos.</p>
        </div>
        <span className="resto-demo__badge">6 en cola</span>
      </header>
      <div className="resto-demo__cards">
        {orders.map((o) => (
          <article key={o.mesa} className="resto-demo__order">
            <div>
              <strong>{o.mesa}</strong>
              <p>{o.items}</p>
            </div>
            <div className="resto-demo__order-meta">
              <span>{o.min}</span>
              <span className="resto-demo__tag resto-demo__tag--warn">{o.estado}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function BarView() {
  const drinks = [
    { mesa: "Barra", items: "3 tragos", min: "2 min", estado: "En prep." },
    { mesa: "Mesa 5", items: "2 jugos · 1 soda", min: "1 min", estado: "Listo" },
    { mesa: "Mesa 12", items: "Copa de vino x2", min: "5 min", estado: "En cola" },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Bar</h3>
          <p>Bebidas y pedidos de barra.</p>
        </div>
        <span className="resto-demo__badge">4 activos</span>
      </header>
      <div className="resto-demo__cards">
        {drinks.map((o) => (
          <article key={`${o.mesa}-${o.items}`} className="resto-demo__order">
            <div>
              <strong>{o.mesa}</strong>
              <p>{o.items}</p>
            </div>
            <div className="resto-demo__order-meta">
              <span>{o.min}</span>
              <span className="resto-demo__tag resto-demo__tag--warn">{o.estado}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ClientesView() {
  const clients = [
    { name: "Ana Torres", visits: 12, gasto: "S/ 860", nivel: "VIP" },
    { name: "Luis Ramos", visits: 5, gasto: "S/ 240", nivel: "Frecuente" },
    { name: "María Quispe", visits: 2, gasto: "S/ 95", nivel: "Nuevo" },
    { name: "Carlos Díaz", visits: 9, gasto: "S/ 510", nivel: "Frecuente" },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Clientes</h3>
          <p>Historial y fidelización de comensales.</p>
        </div>
        <span className="resto-demo__badge">1,842 clientes</span>
      </header>
      <div className="resto-demo__kpis resto-demo__kpis--3">
        <article>
          <span>Nuevos este mes</span>
          <strong>86</strong>
        </article>
        <article>
          <span>Clientes VIP</span>
          <strong>124</strong>
        </article>
        <article>
          <span>Recompra</span>
          <strong>63%</strong>
        </article>
      </div>
      <div className="resto-demo__table">
        <div className="resto-demo__tr resto-demo__tr--head">
          <span>Cliente</span>
          <span>Visitas</span>
          <span>Gasto</span>
          <span>Nivel</span>
        </div>
        {clients.map((c) => (
          <div key={c.name} className="resto-demo__tr">
            <span>{c.name}</span>
            <span>{c.visits}</span>
            <span>{c.gasto}</span>
            <span className="resto-demo__tag resto-demo__tag--ok">{c.nivel}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function AlmacenView() {
  const warehouses = [
    { name: "Almacén central", zona: "Planta", estado: "Activo", items: "142" },
    { name: "Cámara fría", zona: "Cocina", estado: "Activo", items: "38" },
    { name: "Barra", zona: "Salón", estado: "Activo", items: "24" },
    { name: "Depósito seco", zona: "Sótano", estado: "Revisión", items: "10" },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Almacenes</h3>
          <p>Ubicaciones y estado de tus depósitos.</p>
        </div>
        <span className="resto-demo__badge">4 almacenes</span>
      </header>
      <div className="resto-demo__table">
        <div className="resto-demo__tr resto-demo__tr--head">
          <span>Almacén</span>
          <span>Zona</span>
          <span>Estado</span>
          <span>Ítems</span>
        </div>
        {warehouses.map((w) => (
          <div key={w.name} className="resto-demo__tr">
            <span>{w.name}</span>
            <span>{w.zona}</span>
            <span
              className={
                w.estado === "Activo"
                  ? "resto-demo__tag resto-demo__tag--ok"
                  : "resto-demo__tag resto-demo__tag--warn"
              }
            >
              {w.estado}
            </span>
            <span>{w.items}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function InventarioView() {
  const items = [
    { name: "Cerveza Pilsen 355ml", cat: "Cervezas", stock: "Agotado", qty: "0 und" },
    { name: "Inca Kola 500ml", cat: "Gaseosas", stock: "OK", qty: "96 und" },
    { name: "Coca-Cola 500ml", cat: "Gaseosas", stock: "Bajo", qty: "12 und" },
    { name: "Vino tinto reserva", cat: "Vinos", stock: "Bajo", qty: "4 bot." },
    { name: "Agua San Luis 625ml", cat: "Bebidas", stock: "OK", qty: "48 und" },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Inventario</h3>
          <p>Stock de bebidas envasadas (cerveza, gaseosas, vinos…).</p>
        </div>
        <span className="resto-demo__badge">86 ítems</span>
      </header>
      <div className="resto-demo__table">
        <div className="resto-demo__tr resto-demo__tr--head">
          <span>Ítem</span>
          <span>Categoría</span>
          <span>Stock</span>
          <span>Cantidad</span>
        </div>
        {items.map((p) => (
          <div key={p.name} className="resto-demo__tr">
            <span>{p.name}</span>
            <span>{p.cat}</span>
            <span
              className={
                p.stock === "OK"
                  ? "resto-demo__tag resto-demo__tag--ok"
                  : p.stock === "Bajo"
                    ? "resto-demo__tag resto-demo__tag--warn"
                    : "resto-demo__tag resto-demo__tag--bad"
              }
            >
              {p.stock}
            </span>
            <span>{p.qty}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function InformesView() {
  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Informes</h3>
          <p>Indicadores clave del local.</p>
        </div>
        <span className="resto-demo__badge">Semana actual</span>
      </header>
      <div className="resto-demo__kpis">
        <article>
          <span>Ventas semana</span>
          <strong>S/ 28,640</strong>
        </article>
        <article>
          <span>Hora punta</span>
          <strong>17:00</strong>
        </article>
        <article>
          <span>Plato top</span>
          <strong>Lomo</strong>
        </article>
        <article>
          <span>Mesa top</span>
          <strong>Mesa 12</strong>
        </article>
      </div>
      <div className="resto-demo__report-list">
        <div>
          <span>Margen estimado</span>
          <strong>34%</strong>
        </div>
        <div>
          <span>Salón vs barra</span>
          <strong>72% / 28%</strong>
        </div>
        <div>
          <span>Ticket más alto</span>
          <strong>S/ 486.00</strong>
        </div>
        <div>
          <span>Cancelaciones</span>
          <strong>1.8%</strong>
        </div>
      </div>
    </>
  );
}

function ConfigView() {
  const settings = [
    { label: "Local", value: "Miraflores" },
    { label: "Impresora cocina", value: "Conectada" },
    { label: "Usuarios activos", value: "8 de 10" },
    { label: "Menú digital", value: "Publicado" },
    { label: "Turno actual", value: "Almuerzo" },
  ];

  return (
    <>
      <header className="resto-demo__head">
        <div>
          <h3>Configuración</h3>
          <p>Ajustes del local y del equipo.</p>
        </div>
        <span className="resto-demo__badge">Demo</span>
      </header>
      <div className="resto-demo__report-list">
        {settings.map((s) => (
          <div key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

function ModuleBody({
  id,
  aiOpen,
  onToggleAi,
  aiIndex,
}: {
  id: ModuleId;
  aiOpen: boolean;
  onToggleAi: () => void;
  aiIndex: number;
}) {
  switch (id) {
    case "caja":
      return <CajaView />;
    case "mesas":
      return <MesasView />;
    case "cocina":
      return <CocinaView />;
    case "bar":
      return <BarView />;
    case "clientes":
      return <ClientesView />;
    case "almacen":
      return <AlmacenView />;
    case "inventario":
      return <InventarioView />;
    case "informes":
      return <InformesView />;
    case "config":
      return <ConfigView />;
    default:
      return (
        <EscritorioView
          aiOpen={aiOpen}
          onToggleAi={onToggleAi}
          aiIndex={aiIndex}
        />
      );
  }
}

export function RestoDemo() {
  const [active, setActive] = useState<ModuleId>("escritorio");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiIndex, setAiIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAiIndex((n) => (n + 1) % aiAlerts.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="resto-demo" role="region" aria-label="Demo interactiva de Resto Fadey">
      <aside className="resto-demo__side">
        <div className="resto-demo__logo">
          <span className="resto-demo__logo-mark" aria-hidden="true">
            ⌘
          </span>
          <strong>Resto Fadey</strong>
        </div>
        <nav className="resto-demo__nav" aria-label="Módulos del sistema">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={[
                "resto-demo__nav-item",
                item.id === "config" ? "resto-demo__nav-item--config" : "",
                active === item.id ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActive(item.id)}
              title={item.label}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className="resto-demo__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="resto-demo__main">
        <ModuleBody
          id={active}
          aiOpen={aiOpen}
          onToggleAi={() => setAiOpen((v) => !v)}
          aiIndex={aiIndex}
        />
      </div>
    </div>
  );
}
