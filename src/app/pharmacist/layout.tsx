import { LayoutDashboard, Package, Pill } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function PharmacistLayout({ children }: LayoutProps<"/pharmacist">) {
  const user = await requireRole("pharmacist");
  return (
    <DashboardShell
      roleLabel="Pharmacist"
      userName={user.name}
      nav={[
        { href: "/pharmacist", label: "Overview", icon: LayoutDashboard },
        { href: "/pharmacist/inventory", label: "Inventory", icon: Pill },
        { href: "/pharmacist/orders", label: "Orders", icon: Package },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
