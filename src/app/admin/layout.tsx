import { BadgeCheck, Code2, LayoutDashboard, Package, Pill, Store } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata = { title: "Admin panel" };
// Admin reads mutable in-memory data; never prerender.
export const dynamic = "force-dynamic";

/** Admin panel — localhost only (see src/proxy.ts). No login by design. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <DashboardShell
      roleLabel="Admin · localhost"
      showLogout={false}
      nav={[
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/verifications", label: "Verifications", icon: BadgeCheck },
        { href: "/admin/medicines", label: "Medicine database", icon: Pill },
        { href: "/admin/pharmacies", label: "Pharmacies", icon: Store },
        { href: "/admin/orders", label: "Orders", icon: Package },
        { href: "/admin/api-docs", label: "API reference", icon: Code2 },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
