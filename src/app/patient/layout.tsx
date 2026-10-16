import { FileText, LayoutDashboard, Package, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function PatientLayout({ children }: LayoutProps<"/patient">) {
  const user = await requireRole("patient");
  return (
    <DashboardShell
      roleLabel="Patient"
      userName={user.name}
      nav={[
        { href: "/patient", label: "Overview", icon: LayoutDashboard },
        { href: "/patient/prescriptions", label: "My prescriptions", icon: FileText },
        { href: "/patient/orders", label: "My orders", icon: Package },
        { href: "/medicines", label: "Find medicine", icon: Search },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
