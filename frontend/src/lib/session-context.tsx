"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectEndpoint,
  disconnect,
  type ConnectResponse,
} from "@/lib/api";

type SessionContextValue = {
  connected: boolean;
  loading: boolean;
  error: string | null;
  session: ConnectResponse | null;
  customHeaders: Record<string, string>;
  timeout: number;
  connect: (endpoint: string) => Promise<void>;
  disconnectSession: () => Promise<void>;
  setCustomHeaders: (headers: Record<string, string>) => void;
  setTimeout: (timeout: number) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const STORAGE_KEY = "xytherql-session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ConnectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>(
    {}
  );
  const [timeout, setTimeoutValue] = useState(15);

  useEffect(() => {
    async function restoreSession() {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const stored = JSON.parse(raw) as ConnectResponse;
        if (!stored.session_id) {
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }

        const apiBase =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const res = await fetch(
          `${apiBase}/api/session/${stored.session_id}`,
          { method: "GET" }
        );

        if (!res.ok) {
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }

        setSession(stored);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    restoreSession();
  }, []);

  const connect = useCallback(
    async (endpoint: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await connectEndpoint(endpoint, customHeaders, timeout);
        setSession(res);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection failed");
        setSession(null);
        sessionStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    },
    [customHeaders, timeout]
  );

  const disconnectSession = useCallback(async () => {
    if (session?.session_id) {
      try {
        await disconnect(session.session_id);
      } catch {
        /* ignore */
      }
    }
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      connected: !!session,
      loading,
      error,
      session,
      customHeaders,
      timeout,
      connect,
      disconnectSession,
      setCustomHeaders,
      setTimeout: setTimeoutValue,
    }),
    [
      session,
      loading,
      error,
      customHeaders,
      timeout,
      connect,
      disconnectSession,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
