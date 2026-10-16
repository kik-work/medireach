import { FilePlus, FileText, LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function DoctorLayout({ children }: LayoutProps<"/doctor">) {
  const user = await requireRole("doctor");
  return (
    <DashboardShell
      roleLabel="Doctor"
      userName={user.name}
      nav={[
        { href: "/doctor", label: "Overview", icon: LayoutDashboard },
        { href: "/doctor/prescriptions", label: "Prescription history", icon: FileText },
        { href: "/doctor/prescriptions/new", label: "New prescription", icon: FilePlus },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
