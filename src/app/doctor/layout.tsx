import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { getDashboardSeed } from "@/lib/services/seed.service";

export default function DoctorLayout({ children }: LayoutProps<"/doctor">) {
  return <RoleDashboard role="doctor" seed={getDashboardSeed()}>{children}</RoleDashboard>;
}
