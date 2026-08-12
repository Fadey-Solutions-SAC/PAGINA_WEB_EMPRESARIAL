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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "40px 0px 0px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
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
