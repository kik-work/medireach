"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, type ApiResult } from "@/lib/api";
import type { DashboardData } from "@/lib/dashboard-types";

export type { DashboardData, DashUser } from "@/lib/dashboard-types";

type Method = "POST" | "PATCH" | "DELETE";

interface Ctx {
  data: DashboardData;
  refresh: () => Promise<void>;
  /** Calls the server, then reloads the dashboard data on success. */
  run: <T = unknown>(method: Method, url: string, body?: unknown) => Promise<ApiResult<T>>;
}

const DataContext = createContext<Ctx | null>(null);

/** Loads this user's dashboard data from the server (/api/dashboard) and reloads it after every change. */
export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await api<DashboardData>("GET", "/api/dashboard");
    if (r.ok) {
      setData(r.data);
      setError(null);
    } else {
      setError(r.error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void refresh();
  }, [refresh]);

  const run = useCallback<Ctx["run"]>(
    async <T,>(method: Method, url: string, body?: unknown) => {
      const r = await api<T>(method, url, body);
      if (r.ok) await refresh();
      return r;
    },
    [refresh],
  );

  const value = useMemo(() => (data ? { data, refresh, run } : null), [data, refresh, run]);

  if (!value) {
    return error ? (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={refresh}>Try again</Button>
      </div>
    ) : (
      <div className="flex justify-center py-24">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading" />
      </div>
    );
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useCtx() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("Dashboard hooks must be used inside <DashboardDataProvider>");
  return ctx;
}

/** The role-scoped data plus `run` / `refresh`. */
export function useDashboardData(): DashboardData & Pick<Ctx, "run" | "refresh"> {
  const { data, run, refresh } = useCtx();
  return { ...data, run, refresh };
}
