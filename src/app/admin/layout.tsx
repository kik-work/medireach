import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export const metadata = { title: "Admin" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RoleDashboard role="admin">{children}</RoleDashboard>;
}
