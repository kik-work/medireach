import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { getDashboardSeed } from "@/lib/services/seed.service";

export const metadata = { title: "Admin" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RoleDashboard role="admin" seed={getDashboardSeed()}>{children}</RoleDashboard>;
}
