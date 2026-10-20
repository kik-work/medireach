"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Session } from "@/lib/session";

export interface SignupInput {
  name: string;
  identifier: string;
  password: string;
  role: "patient" | "doctor" | "pharmacist";
  city?: string;
  registrationNo?: string;
  pharmacyName?: string;
  licenseNo?: string;
  address?: string;
  phone?: string;
}

type Result = { ok: true; session: Session } | { ok: false; error: string };

interface AuthState {
  user: Session | null;
  /** false until the first /api/auth/me answer is in. */
  ready: boolean;
  login: (identifier: string, password: string, scope: "public" | "admin") => Promise<Result>;
  signup: (input: SignupInput) => Promise<Result>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  ready: false,
  login: async () => ({ ok: false, error: "Not ready." }),
  signup: async () => ({ ok: false, error: "Not ready." }),
  logout: async () => {},
});

/** The session lives in an HttpOnly cookie on the server; this only mirrors who is signed in. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<Session | null>("GET", "/api/auth/me").then((r) => {
      if (cancelled) return;
      setUser(r.ok ? r.data : null);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const enter = useCallback(async (call: Promise<Awaited<ReturnType<typeof api<Session>>>>): Promise<Result> => {
    const r = await call;
    if (!r.ok) return { ok: false, error: r.error };
    setUser(r.data);
    return { ok: true, session: r.data };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login: (identifier, password, scope) => enter(api<Session>("POST", "/api/auth/login", { identifier, password, scope })),
      signup: (input) => enter(api<Session>("POST", "/api/auth/signup", input)),
      logout: async () => {
        await api("POST", "/api/auth/logout");
        setUser(null);
      },
    }),
    [user, ready, enter],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
