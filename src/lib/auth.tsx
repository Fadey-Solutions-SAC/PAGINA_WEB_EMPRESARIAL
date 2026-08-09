import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

export type Product = "resto" | "erp" | "web" | "soporte";

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | {
      status: "ready";
      token: string;
      role: "admin" | "client";
      name?: string;
      username?: string;
      userId?: string;
      clientName?: string;
      products?: Product[];
    };

type AuthContextValue = {
  auth: AuthState;
  loginAdmin: (password: string) => Promise<void>;
  loginClient: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "fadey_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ status: "guest" });
  }, []);

  const hydrate = useCallback(async (token: string) => {
    try {
      const me = await api<{
        role: "admin" | "client";
        name?: string;
        username?: string;
        userId?: string;
        clientName?: string;
        products?: Product[];
      }>("/api/auth/me", { token });
      setAuth({
        status: "ready",
        token,
        role: me.role,
        name: me.name,
        username: me.username,
        userId: me.userId,
        clientName: me.clientName,
        products: me.products,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setAuth({ status: "guest" });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setAuth({ status: "guest" });
      return;
    }
    void hydrate(token);
  }, [hydrate]);

  const loginAdmin = useCallback(async (password: string) => {
    const data = await api<{ token: string; role: "admin"; name: string }>(
      "/api/auth/admin",
      { method: "POST", body: JSON.stringify({ password }) },
    );
    localStorage.setItem(STORAGE_KEY, data.token);
    setAuth({
      status: "ready",
      token: data.token,
      role: "admin",
      name: data.name,
    });
  }, []);

  const loginClient = useCallback(async (username: string, password: string) => {
    const data = await api<{
      token: string;
      role: "client";
      userId: string;
      username: string;
      clientName: string;
      products: Product[];
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(STORAGE_KEY, data.token);
    setAuth({
      status: "ready",
      token: data.token,
      role: "client",
      userId: data.userId,
      username: data.username,
      clientName: data.clientName,
      products: data.products,
    });
  }, []);

  const token = auth.status === "ready" ? auth.token : null;

  const value = useMemo(
    () => ({ auth, loginAdmin, loginClient, logout, token }),
    [auth, loginAdmin, loginClient, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
