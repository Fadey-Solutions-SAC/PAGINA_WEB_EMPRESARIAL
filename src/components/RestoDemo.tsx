import { useState } from "react";
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
  { t: "Lun", h: 38 },
  { t: "Mar", h: 44 },
  { t: "Mié", h: 41 },
  { t: "Jue", h: 52 },
  { t: "Vie", h: 58 },
  { t: "Sáb", h: 55 },
  { t: "Dom", h: 96 },
];

function DemoPage({
  title,
  subtitle,
  badge,
  showDate,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  showDate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="resto-demo__view resto-demo__view--open">
      <header className="resto-demo__head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="resto-demo__head-actions">
          {badge}
          {showDate ? (
            <button type="button" className="resto-demo__date-picker">
              20 de mayo de 2024 <span aria-hidden="true">▾</span>
            </button>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint = "Ventas del día",
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="resto-demo__kpi-card">
      <span className="resto-demo__kpi-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="resto-demo__kpi-body">
        <span className="resto-demo__kpi-label">{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

function EscritorioView() {
  return (
    <DemoPage
      title="Escritorio"
      subtitle="Resumen de ventas y actividad del restaurante"
      showDate
    >
      <div className="resto-demo__ai-banner resto-demo__ai-banner--suggest" role="status">
        <span className="resto-demo__ai-spark" aria-hidden="true">
          ✦
        </span>
        <p>
          <strong>Sugerencia IA:</strong> Las ventas suelen aumentar los fines
          de semana. Considera ajustar tu stock y personal.
        </p>
        <button type="button" className="resto-demo__ai-dismiss" aria-label="Cerrar sugerencia">
          ×
        </button>
      </div>

      <div className="resto-demo__chart-card">
        <div className="resto-demo__chart-head">
          <div className="resto-demo__chart-title">
            <strong>Gráfica de ventas</strong>
            <small>Ventas diarias de la semana</small>
          </div>
          <label className="resto-demo__select">
            <span className="resto-demo__sr">Periodo</span>
            <select defaultValue="week">
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
          </label>
        </div>
        <div className="resto-demo__chart-wrap">
          <div className="resto-demo__chart-axis" aria-hidden="true">
            <span>S/ 2500</span>
            <span>S/ 2000</span>
            <span>S/ 1500</span>
            <span>S/ 1000</span>
            <span>S/ 500</span>
            <span>S/ 0</span>
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
      </div>

      <div className="resto-demo__kpis resto-demo__kpis--cards">
        <KpiCard icon="💵" label="Efectivo" value="S/. 13,346.45" />
        <KpiCard icon="💳" label="Tarjeta" value="S/. 8,392.10" />
        <KpiCard icon="📱" label="Yape/Plin" value="S/. 5,120.00" />
        <KpiCard icon="↗" label="Total" value="S/. 26,858.55" />
      </div>
    </DemoPage>
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
    <DemoPage
      title="Caja"
      subtitle="Cobros, tickets y cierre de turno"
      badge={<span className="resto-demo__badge">Hoy · 48 tickets</span>}
    >
      <div className="resto-demo__kpis resto-demo__kpis--3 resto-demo__kpis--surface">
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
    </DemoPage>
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
    <DemoPage
      title="Mesas"
      subtitle="Estado del salón en tiempo real"
      badge={<span className="resto-demo__badge">18 mesas</span>}
    >
      <div className="resto-demo__kpis resto-demo__kpis--3 resto-demo__kpis--surface">
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
    </DemoPage>
  );
}

function CocinaView() {
  const orders = [
    { mesa: "Mesa 3", items: "2 platos · 1 guarnición", min: "4 min", estado: "En prep." },
    { mesa: "Mesa 8", items: "1 menú ejecutivo", min: "11 min", estado: "Listo" },
    { mesa: "Mostrador", items: "Combo familiar", min: "7 min", estado: "En prep." },
  ];

  return (
    <DemoPage
      title="Cocina"
      subtitle="Cola de preparación y tiempos"
      badge={<span className="resto-demo__badge">6 en cola</span>}
    >
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
    </DemoPage>
  );
}

function BarView() {
  const drinks = [
    { mesa: "Barra", items: "3 tragos", min: "2 min", estado: "En prep." },
    { mesa: "Mesa 5", items: "2 jugos · 1 soda", min: "1 min", estado: "Listo" },
    { mesa: "Mesa 12", items: "Copa de vino x2", min: "5 min", estado: "En cola" },
  ];

  return (
    <DemoPage
      title="Bar"
      subtitle="Bebidas y pedidos de barra"
      badge={<span className="resto-demo__badge">4 activos</span>}
    >
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
    </DemoPage>
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
    <DemoPage
      title="Clientes"
      subtitle="Historial y fidelización de comensales"
      badge={<span className="resto-demo__badge">1,842 clientes</span>}
    >
      <div className="resto-demo__kpis resto-demo__kpis--3 resto-demo__kpis--surface">
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
    </DemoPage>
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
    <DemoPage
      title="Almacenes"
      subtitle="Ubicaciones y estado de tus depósitos"
      badge={<span className="resto-demo__badge">4 almacenes</span>}
    >
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
    </DemoPage>
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
    <DemoPage
      title="Inventario"
      subtitle="Stock de bebidas envasadas (cerveza, gaseosas, vinos…)"
      badge={<span className="resto-demo__badge">86 ítems</span>}
    >
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
    </DemoPage>
  );
}

function InformesView() {
  return (
    <DemoPage
      title="Informes"
      subtitle="Indicadores clave del local"
      badge={<span className="resto-demo__badge">Semana actual</span>}
    >
      <div className="resto-demo__kpis resto-demo__kpis--surface">
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
    </DemoPage>
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
    <DemoPage
      title="Configuración"
      subtitle="Ajustes del local y del equipo"
      badge={<span className="resto-demo__badge">Demo</span>}
    >
      <div className="resto-demo__report-list resto-demo__report-list--flush">
        {settings.map((s) => (
          <div key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </DemoPage>
  );
}

function ModuleBody({ id }: { id: ModuleId }) {
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
    case "escritorio":
    default:
      return <EscritorioView />;
  }
}

export function RestoDemo() {
  const [active, setActive] = useState<ModuleId>("escritorio");

  return (
    <div className="resto-demo" role="region" aria-label="Demo interactiva de Resto Fadey">
      <aside className="resto-demo__side">
        <div className="resto-demo__logo">
          <span className="resto-demo__logo-mark" aria-hidden="true">
            🍽
          </span>
          <div className="resto-demo__logo-text">
            <strong>Resto Fadey</strong>
            <small>Gestión restaurant</small>
          </div>
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
        <ModuleBody id={active} />
      </div>
    </div>
  );
}
