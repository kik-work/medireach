import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { getDashboardSeed } from "@/lib/services/seed.service";

export default function PatientLayout({ children }: LayoutProps<"/patient">) {
  return <RoleDashboard role="patient" seed={getDashboardSeed()}>{children}</RoleDashboard>;
}
