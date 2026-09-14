export function goToSection(href: string) {
  const id = href.replace("#", "");
  if (!id || id === "inicio") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", "#inicio");
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
    return;
  }
  window.location.hash = href;
}
