import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

export type SiteTheme = "blue" | "emerald";

const STORAGE_KEY = "fadey-site-theme";

type ThemeContextValue = {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function readStoredTheme(): SiteTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "emerald" || raw === "blue") return raw;
  } catch {
    /* ignore */
  }
  return "emerald";
}

export function applyThemeToDocument(theme: SiteTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Call before React paint to avoid flash. */
export function initThemeFromStorage() {
  applyThemeToDocument(readStoredTheme());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>(() => readStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    void api<{ theme: SiteTheme }>("/api/theme")
      .then((data) => {
        if (cancelled) return;
        if (data.theme === "emerald" || data.theme === "blue") {
          setThemeState(data.theme);
        }
      })
      .catch(() => {
        /* API caído: se queda el tema local */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "blue" ? "emerald" : "blue"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Triple-click handler for brand/logo. */
export function useTripleClick(onTriple: () => void, windowMs = 650) {
  const clicks = useRef({ n: 0, t: 0 });
  return useCallback(() => {
    const now = Date.now();
    const next =
      now - clicks.current.t < windowMs ? clicks.current.n + 1 : 1;
    clicks.current = { n: next, t: now };
    if (next >= 3) {
      clicks.current = { n: 0, t: 0 };
      onTriple();
    }
  }, [onTriple, windowMs]);
}
