const WA_NUMBER = "51921028316";
const MAILTO = "contacto@fadeysolutions.com";

export function waUrl(message?: string) {
  const base = `https://wa.me/${WA_NUMBER}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function mailtoInfo() {
  const subject = encodeURIComponent("Solicitud de información — Fadey Solutions");
  const body = encodeURIComponent(
    [
      "Hola Fadey Solutions,",
      "",
      "Quiero solicitar información sobre sus soluciones.",
      "",
      "Producto de interés: ________",
      "Nombre: ________",
      "Empresa: ________",
      "Teléfono: ________",
    ].join("\n"),
  );
  return `mailto:${MAILTO}?subject=${subject}&body=${body}`;
}

export function msgInfo() {
  return [
    "Hola Fadey Solutions,",
    "",
    "Quiero solicitar información sobre sus soluciones.",
    "",
    "Producto de interés: ________",
    "Nombre: ________",
    "Empresa / local: ________",
  ].join("\n");
}

export function msgQuoteProduct() {
  return [
    "Hola Fadey Solutions,",
    "",
    "Quiero solicitar una cotización.",
    "Producto de interés: ________ (Resto Fadey / Desarrollo web / Soporte)",
    "",
    "Nombre: ________",
    "Empresa / local: ________",
    "Ciudad: ________",
  ].join("\n");
}

export function msgRestoPlan(planName: string, price: string) {
  return [
    "Hola Fadey Solutions,",
    "",
    `Quiero contratar el plan *${planName}* de Resto Fadey (S/ ${price}/mes).`,
    "",
    "Tipo de restaurante / negocio: ________",
    "Nombre del local: ________",
    "Ciudad: ________",
    "",
    "Por favor, indíquenme los siguientes pasos para activar el servicio.",
  ].join("\n");
}

export function msgRestoDemo() {
  return [
    "Hola Fadey Solutions,",
    "",
    "Quiero solicitar una *demostración en vivo* del sistema Resto Fadey.",
    "Me interesa ver cómo funciona pedidos, caja, cocina/barra e inventario.",
    "",
    "Tipo de negocio: ________",
    "Ciudad: ________",
  ].join("\n");
}

export function msgRestoInfo() {
  return [
    "Hola Fadey Solutions,",
    "",
    "Quiero información / cotización sobre *Resto Fadey*.",
    "",
    "Tipo de negocio: ________",
    "Nombre: ________",
    "Ciudad: ________",
  ].join("\n");
}

export function msgErpNotify(planName?: string) {
  if (planName) {
    return [
      "Hola Fadey Solutions,",
      "",
      `Quiero que me avisen cuando la preventa o demostración de *ERP Fadey* esté disponible.`,
      `Plan de interés: *${planName}*.`,
      "",
      "Nombre: ________",
      "Empresa: ________",
      "Ciudad: ________",
    ].join("\n");
  }
  return [
    "Hola Fadey Solutions,",
    "",
    "Quiero ser informado sobre la *funcionalidad total* del sistema ERP Fadey y que me avisen cuando esté disponible.",
    "",
    "Nombre: ________",
    "Empresa: ________",
    "Ciudad: ________",
  ].join("\n");
}

export function msgSoporte() {
  return [
    "Hola Fadey Solutions,",
    "",
    "Quiero información / cotización de *soporte y mantenimiento*.",
    "",
    "Proyecto / sitio: ________",
    "Nombre: ________",
    "Ciudad: ________",
  ].join("\n");
}

export type WebProjectForm = {
  projectType: string;
  budget: string;
  timeline: string;
  structure: string;
  name: string;
  contact: string;
};

export function msgWebProject(data: WebProjectForm) {
  return [
    "Hola Fadey Solutions,",
    "",
    "Quiero solicitar un *proyecto web*.",
    "",
    `Tipo de proyecto: ${data.projectType || "________"}`,
    `Presupuesto aproximado: ${data.budget || "________"}`,
    `Tiempo deseado: ${data.timeline || "________"}`,
    `Estructura / páginas: ${data.structure || "________"}`,
    "",
    `Nombre: ${data.name || "________"}`,
    `Contacto (teléfono / correo): ${data.contact || "________"}`,
  ].join("\n");
}
