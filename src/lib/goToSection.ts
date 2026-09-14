function sectionIdFromHref(href: string): string {
  const trimmed = href.trim();
  const withoutPath = trimmed.replace(/^\/+/, "");
  if (withoutPath.startsWith("#")) {
    return withoutPath.slice(1);
  }
  return withoutPath;
}

export function goToSection(href: string) {
  const id = sectionIdFromHref(href);
  if (!id || id === "inicio") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", window.location.pathname);
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}#${id}`,
    );
    return;
  }
  window.location.hash = `#${id}`;
}
