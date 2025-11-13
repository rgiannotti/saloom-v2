import * as SecureStore from "expo-secure-store";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { Platform } from "react-native";

import { API_BASE_URL } from "../config";
import type { AuthSession } from "../types/auth";

interface LoginParams {
  email: string;
  password: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
  initializing: boolean;
}

interface LoginResponse {
  user: AuthSession["user"];
  tokens: AuthSession["tokens"];
}

const SESSION_KEY = "saloom-client-session";
const memoryFallback = new Map<string, string>();

const browserStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

const storage = {
  async getItem(key: string) {
    if (Platform.OS === "web") {
      const store = browserStorage();
      if (store) {
        return store.getItem(key);
      }
      return memoryFallback.get(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      const store = browserStorage();
      if (store) {
        store.setItem(key, value);
      } else {
        memoryFallback.set(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string) {
    if (Platform.OS === "web") {
      const store = browserStorage();
      if (store) {
        store.removeItem(key);
      } else {
        memoryFallback.delete(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isProWithClient = (user: AuthSession["user"]) => {
  const hasProRole = user.roles?.some((role) => role.toLowerCase() === "pro");
  return Boolean(hasProRole && user.client);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  const persistSession = useCallback(async (value: AuthSession | null) => {
    setSession(value);
    try {
      if (value) {
        await storage.setItem(SESSION_KEY, JSON.stringify(value));
      } else {
        await storage.deleteItem(SESSION_KEY);
      }
    } catch (err) {
      console.warn("No se pudo persistir la sesión del cliente:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await storage.getItem(SESSION_KEY);
        if (!active) {
          return;
        }
        if (raw) {
          const parsed = JSON.parse(raw) as AuthSession;
          if (isProWithClient(parsed.user)) {
            setSession(parsed);
          } else {
            await storage.deleteItem(SESSION_KEY);
            setSession(null);
          }
        } else {
          setSession(null);
        }
      } catch {
        await storage.deleteItem(SESSION_KEY);
        setSession(null);
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async ({ email, password }: LoginParams) => {
      const response = await fetch(`${API_BASE_URL}/auth/client/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      let payload: LoginResponse | { message?: string } | null = null;
      try {
        payload = await response.json();
      } catch {
        // ignore JSON errors to throw a generic message below
      }

      if (!response.ok || !payload || !("user" in payload)) {
        throw new Error(
          (payload && "message" in payload && payload.message) ||
            "No se pudo iniciar sesión. Verifica tus credenciales."
        );
      }

      if (!isProWithClient(payload.user)) {
        throw new Error(
          "Solo los profesionales con un cliente asignado pueden usar esta app. Contacta al administrador."
        );
      }

      await persistSession({
        user: payload.user,
        tokens: payload.tokens
      });
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null).catch(() => {
      setSession(null);
    });
  }, [persistSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login,
      logout,
      initializing
    }),
    [session, login, logout, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
