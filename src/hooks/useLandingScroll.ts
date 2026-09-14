import { useEffect } from "react";

function scrollToHero(behavior: ScrollBehavior = "auto") {
  window.scrollTo({ top: 0, left: 0, behavior });
}

/** Home siempre arranca en el hero; el hash solo aplica tras clic en la misma sesión (goToSection). */
export function useLandingScroll() {
  useEffect(() => {
    const path = window.location.pathname || "/";
    if (path !== "/" && path !== "/index.html") {
      return;
    }

    const html = document.documentElement;
    html.setAttribute("data-landing-scroll", "pending");

    try {
      history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }

    const cleanUrl = () => {
      const hash = window.location.hash.slice(1);
      if (hash && hash !== "inicio") {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    };

    const finishLanding = () => {
      scrollToHero("auto");
      cleanUrl();
      html.setAttribute("data-landing-scroll", "ready");
    };

    finishLanding();
    const t1 = window.setTimeout(finishLanding, 0);
    const t2 = window.setTimeout(finishLanding, 150);
    const t3 = window.setTimeout(finishLanding, 400);

    const onPageshow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        finishLanding();
      }
    };
    window.addEventListener("pageshow", onPageshow);

    const desktopMq = window.matchMedia("(min-width: 921px)");
    const onDesktopChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        finishLanding();
      }
    };
    desktopMq.addEventListener("change", onDesktopChange);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("pageshow", onPageshow);
      desktopMq.removeEventListener("change", onDesktopChange);
    };
  }, []);
}
