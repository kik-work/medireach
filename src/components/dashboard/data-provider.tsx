"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { getUsersSnapshot, parseLocalUsers, subscribeStore } from "@/lib/auth-store";
import { getDataSnapshot, parseOverlay } from "@/lib/dashboard-store";
import type { DashboardSeed } from "@/lib/services/seed.service";
import type { Medicine, Order, Pharmacy, Prescription, StockItem, VerificationStatus } from "@/lib/types";

/** A person as the dashboards see them: seed users plus accounts created through sign up. */
export interface DashUser {
  id: string;
  name: string;
  identifier: string;
  role: "patient" | "doctor" | "pharmacist";
  status: VerificationStatus;
  registrationNo?: string;
  city?: string;
  pharmacyId?: string;
}

export interface DashboardData {
  medicines: Medicine[];
  pharmacies: Pharmacy[];
  stock: StockItem[];
  users: DashUser[];
  prescriptions: Prescription[];
  orders: Order[];
}

const DataContext = createContext<DashboardData | null>(null);

export function DashboardDataProvider({ seed, children }: { seed: DashboardSeed; children: React.ReactNode }) {
  const rawData = useSyncExternalStore(subscribeStore, getDataSnapshot, () => null);
  const rawUsers = useSyncExternalStore(subscribeStore, getUsersSnapshot, () => null);

  const data = useMemo<DashboardData>(() => {
    const o = parseOverlay(rawData);
    const seedUsers: DashUser[] = seed.users.map((u) => ({
      id: u.id,
      name: u.name,
      identifier: u.email,
      role: u.role as DashUser["role"],
      status: o.userStatus[u.id] ?? u.status,
      registrationNo: u.registrationNo,
      city: u.city,
      pharmacyId: u.pharmacyId,
    }));
    const signedUp: DashUser[] = parseLocalUsers(rawUsers).flatMap((u) =>
      u.role === "admin"
        ? []
        : [{
            id: u.id,
            name: u.name,
            identifier: u.identifier,
            role: u.role,
            // New doctors wait for admin approval; patients need none.
            status: o.userStatus[u.id] ?? (u.role === "doctor" ? ("pending" as const) : ("verified" as const)),
            registrationNo: u.registrationNo,
          }],
    );
    return {
      medicines: [...seed.medicines, ...o.medicines],
      pharmacies: seed.pharmacies.map((p) => ({ ...p, status: o.pharmacyStatus[p.id] ?? p.status })),
      stock: seed.stock,
      users: [...seedUsers, ...signedUp],
      prescriptions: [...o.prescriptions, ...seed.prescriptions],
      orders: [...o.orders, ...seed.orders].map((ord) => ({ ...ord, status: o.orderStatus[ord.id] ?? ord.status })),
    };
  }, [seed, rawData, rawUsers]);

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useDashboardData(): DashboardData {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDashboardData must be used inside <DashboardDataProvider>");
  return ctx;
}
