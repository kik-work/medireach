"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { getSessionSnapshot, parseSession, subscribeStore, type Session } from "@/lib/auth-store";

interface AuthState {
  user: Session | null;
  /** false during SSR and the first client render, before localStorage is read. */
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, ready: false });

const noopSubscribe = () => () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribeStore, getSessionSnapshot, () => null);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const value = useMemo<AuthState>(() => ({ user: parseSession(raw), ready }), [raw, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
