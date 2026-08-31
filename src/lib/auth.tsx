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
      impersonating?: boolean;
    };

type AuthContextValue = {
  auth: AuthState;
  loginAdmin: (password: string) => Promise<void>;
  loginClient: (username: string, password: string) => Promise<void>;
  enterAsClient: (userId: string, adminToken: string) => Promise<void>;
  exitImpersonation: () => Promise<void>;
  logout: () => void;
  token: string | null;
  isImpersonating: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "fadey_auth_token";
const ADMIN_STORAGE_KEY = "fadey_admin_token";
const IMPERSONATION_KEY = "fadey_impersonating";

function clearImpersonationStorage() {
  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  sessionStorage.removeItem(IMPERSONATION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearImpersonationStorage();
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
        impersonating?: boolean;
      }>("/api/auth/me", { token });
      const impersonating =
        me.impersonating === true ||
        sessionStorage.getItem(IMPERSONATION_KEY) === "1";
      setAuth({
        status: "ready",
        token,
        role: me.role,
        name: me.name,
        username: me.username,
        userId: me.userId,
        clientName: me.clientName,
        products: me.products,
        impersonating: me.role === "client" ? impersonating : undefined,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      clearImpersonationStorage();
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
    clearImpersonationStorage();
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
    clearImpersonationStorage();
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

  const enterAsClient = useCallback(
    async (userId: string, adminToken: string) => {
      const data = await api<{
        token: string;
        role: "client";
        userId: string;
        username: string;
        clientName: string;
        products: Product[];
      }>(`/api/users/${userId}/enter-as-client`, {
        method: "POST",
        token: adminToken,
      });
      sessionStorage.setItem(ADMIN_STORAGE_KEY, adminToken);
      sessionStorage.setItem(IMPERSONATION_KEY, "1");
      localStorage.setItem(STORAGE_KEY, data.token);
      setAuth({
        status: "ready",
        token: data.token,
        role: "client",
        userId: data.userId,
        username: data.username,
        clientName: data.clientName,
        products: data.products,
        impersonating: true,
      });
    },
    [],
  );

  const exitImpersonation = useCallback(async () => {
    const adminToken = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    clearImpersonationStorage();
    if (adminToken) {
      localStorage.setItem(STORAGE_KEY, adminToken);
      await hydrate(adminToken);
      return;
    }
    logout();
  }, [hydrate, logout]);

  const token = auth.status === "ready" ? auth.token : null;
  const isImpersonating =
    auth.status === "ready" &&
    auth.role === "client" &&
    auth.impersonating === true;

  const value = useMemo(
    () => ({
      auth,
      loginAdmin,
      loginClient,
      enterAsClient,
      exitImpersonation,
      logout,
      token,
      isImpersonating,
    }),
    [
      auth,
      loginAdmin,
      loginClient,
      enterAsClient,
      exitImpersonation,
      logout,
      token,
      isImpersonating,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
