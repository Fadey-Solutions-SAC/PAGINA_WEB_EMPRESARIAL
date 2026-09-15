import { useEffect, useRef, useState } from "react";

/**
 * On phones, mark all .reveal visible immediately and skip IntersectionObserver.
 * Prevents blank/white sections while scrolling (opacity:0 waiting for IO).
 */
export function useReveal() {
  useEffect(() => {
    const mobileMq = window.matchMedia("(max-width: 920px)");
    const applyMobileScroll = () => {
      if (!mobileMq.matches) {
        document.documentElement.style.scrollSnapType = "";
        document.documentElement.style.scrollBehavior = "";
        return;
      }
      document.documentElement.style.scrollSnapType = "none";
      document.documentElement.style.scrollBehavior = "auto";
    };
    applyMobileScroll();
    mobileMq.addEventListener("change", applyMobileScroll);

    const elements = document.querySelectorAll<HTMLElement>(".reveal");
    if (!elements.length) {
      return () => mobileMq.removeEventListener("change", applyMobileScroll);
    }

    const preferReduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = mobileMq.matches;

    if (preferReduce || isMobile) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return () => mobileMq.removeEventListener("change", applyMobileScroll);
    }

    const markVisible = (el: Element) => {
      el.classList.add("is-visible");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            markVisible(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "40px 0px 0px 0px" },
    );

    elements.forEach((el) => observer.observe(el));

    /* Con scroll-snap, al encajar una sección revelamos todo su contenido .reveal */
    const snapSections = document.querySelectorAll<HTMLElement>(
      "main .section, main .hero",
    );
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target
            .querySelectorAll<HTMLElement>(".reveal")
            .forEach((el) => markVisible(el));
        });
      },
      { threshold: 0.42, rootMargin: "0px" },
    );

    snapSections.forEach((section) => sectionObserver.observe(section));

    return () => {
      observer.disconnect();
      sectionObserver.disconnect();
      mobileMq.removeEventListener("change", applyMobileScroll);
    };
  }, []);
}

/** Lazy-mount heavy UI when near viewport (mobile performance). */
export function useNearViewport<T extends HTMLElement>(rootMargin = "120px") {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;

    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);

  return { ref, near };
}
