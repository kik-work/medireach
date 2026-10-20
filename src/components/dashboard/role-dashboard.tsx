"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus, FileText, LayoutDashboard, Package, Pill, Search, ShieldCheck, ShoppingCart, Sparkles, Store,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminLogin } from "@/components/auth/admin-login";
import { DashboardDataProvider } from "@/components/dashboard/data-provider";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { AUTH_HOME, type AuthRole } from "@/lib/auth-store";
import type { DashboardSeed } from "@/lib/services/seed.service";

const NAV: Record<AuthRole, { label: string; items: NavItem[] }> = {
  patient: {
    label: "Patient",
    items: [
      { href: "/patient", label: "Dashboard", icon: LayoutDashboard },
      { href: "/medicines", label: "Find medicine", icon: Search },
      { href: "/medicines?rare=1", label: "Rare medicines", icon: Sparkles },
      { href: "/patient/prescriptions", label: "My prescriptions", icon: FileText },
      { href: "/cart", label: "Cart", icon: ShoppingCart },
      { href: "/patient/orders", label: "My orders", icon: Package },
    ],
  },
  doctor: {
    label: "Doctor",
    items: [
      { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
      { href: "/doctor/prescriptions/new", label: "New prescription", icon: FilePlus },
      { href: "/doctor/prescriptions", label: "Prescription history", icon: FileText },
      { href: "/medicines", label: "Medicine catalogue", icon: Pill },
    ],
  },
  admin: {
    label: "Admin",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
      { href: "/admin/pharmacies", label: "Pharmacies", icon: Store },
      { href: "/admin/medicines", label: "Medicine database", icon: Pill },
      { href: "/admin/orders", label: "Orders", icon: Package },
    ],
  },
};

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading" />
    </div>
  );
}

/**
 * Client-side guard + shell for a role dashboard.
 * Wrong role or no session: patient/doctor go to /login; /admin shows its own login form.
 */
export function RoleDashboard({ role, seed, children }: { role: AuthRole; seed: DashboardSeed; children: React.ReactNode }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const allowed = ready && user?.role === role;
  // Non-admin routes bounce away; the admin route shows its login form in place.
  const redirectTo = !ready || allowed ? null : user ? AUTH_HOME[user.role] : role === "admin" ? null : "/login";

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!ready) return <Splash />;
  if (allowed && user) {
    return (
      <DashboardDataProvider seed={seed}>
        <DashboardShell roleLabel={NAV[role].label} user={user} nav={NAV[role].items}>{children}</DashboardShell>
      </DashboardDataProvider>
    );
  }
  if (role === "admin" && !user) return <AdminLogin />;
  return <Splash />;
}
