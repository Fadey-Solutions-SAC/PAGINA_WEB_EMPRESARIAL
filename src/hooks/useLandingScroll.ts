import { useEffect } from "react";

function scrollToLandingTarget(behavior: ScrollBehavior = "auto") {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === "inicio") {
    window.scrollTo({ top: 0, left: 0, behavior });
    return;
  }
  const el = document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior, block: "start" });
    return;
  }
  window.scrollTo({ top: 0, left: 0, behavior });
}

/**
 * Home: always start at hero unless URL has a section hash.
 * Fixes mobile "desktop site" toggle keeping scroll on Resto/ERP.
 */
export function useLandingScroll() {
  useEffect(() => {
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    scrollToLandingTarget("auto");
    const t = window.setTimeout(() => scrollToLandingTarget("auto"), 120);

    const onHashChange = () => scrollToLandingTarget("auto");
    window.addEventListener("hashchange", onHashChange);

    const desktopMq = window.matchMedia("(min-width: 921px)");
    const onDesktopChange = (e: MediaQueryListEvent) => {
      if (!e.matches) return;
      const hash = window.location.hash.slice(1);
      if (!hash || hash === "inicio") {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    };
    desktopMq.addEventListener("change", onDesktopChange);

    return () => {
      history.scrollRestoration = prevRestoration;
      window.clearTimeout(t);
      window.removeEventListener("hashchange", onHashChange);
      desktopMq.removeEventListener("change", onDesktopChange);
    };
  }, []);
}
