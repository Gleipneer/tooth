import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { fetchMe, type UserResponse } from "../lib/api";

type SessionContextValue = {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem("tooth_access_token"));
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMe(token)
      .then((me) => {
        if (!cancelled) {
          setUser(me);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          window.localStorage.removeItem("tooth_access_token");
          setError(err instanceof Error ? err.message : "Session recovery failed");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<SessionContextValue>(
    () => ({
      token,
      user,
      loading,
      error,
      signIn: (nextToken: string) => {
        window.localStorage.setItem("tooth_access_token", nextToken);
        setToken(nextToken);
      },
      signOut: () => {
        window.localStorage.removeItem("tooth_access_token");
        setToken(null);
        setUser(null);
      },
    }),
    [error, loading, token, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
}
