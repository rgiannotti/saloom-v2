import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { API_BASE_URL } from "../config";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_STORAGE_KEY = "saloom_backoffice_session";
const REFRESH_THRESHOLD_MS = 60_000;

type SessionState = {
  token: string;
  refreshToken: string;
  userId: string;
};

const readStoredSession = (): SessionState | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (parsed?.token && parsed?.refreshToken && parsed?.userId) {
      return parsed;
    }
  } catch {
    // ignore invalid state (fallback to forcing login)
  }
  return null;
};

const persistSession = (session: SessionState | null) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
};

const decodeJwtExpiration = (token: string): number | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = JSON.parse(window.atob(padded));
    return typeof decoded?.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SessionState | null>(() => readStoredSession());
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(
    (accessToken: string | null, refresher: () => Promise<void>) => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (!accessToken) {
        return;
      }
      const expiration = decodeJwtExpiration(accessToken);
      if (!expiration) {
        return;
      }
      const delay = Math.max(expiration - Date.now() - REFRESH_THRESHOLD_MS, 0);
      refreshTimeoutRef.current = window.setTimeout(() => {
        refresher().catch(() => {
          /* handled inside refresher */
        });
      }, delay);
    },
    []
  );

  const logout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!session?.userId || !session?.refreshToken) {
      logout();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId, refreshToken: session.refreshToken })
      });
      if (!response.ok) {
        throw new Error("Refresh token inválido");
      }
      const data = await response.json();
      const accessToken = data.tokens?.accessToken;
      const refreshToken = data.tokens?.refreshToken;
      if (!accessToken || !refreshToken) {
        throw new Error("Respuesta inválida del servidor");
      }
      setSession({
        token: accessToken,
        refreshToken,
        userId: session.userId
      });
    } catch (error) {
      console.error("No se pudo refrescar la sesión:", error);
      logout();
    }
  }, [logout, session]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch(`${API_BASE_URL}/auth/backoffice/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }

      const data = await response.json();
      const accessToken = data.tokens?.accessToken;
      const refreshToken = data.tokens?.refreshToken;
      const userId = data.user?._id ?? data.user?.id;

      if (!accessToken || !refreshToken || !userId) {
        throw new Error("Respuesta inválida del servidor");
      }

      setSession({
        token: accessToken,
        refreshToken,
        userId
      });
    },
    []
  );

  useEffect(() => {
    persistSession(session);
  }, [session]);

  useEffect(() => {
    if (!session?.token) {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }
    scheduleRefresh(session.token, refresh);
  }, [refresh, scheduleRefresh, session]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      login,
      logout
    }),
    [login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
