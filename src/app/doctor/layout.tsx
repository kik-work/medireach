import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DoctorLayout({ children }: LayoutProps<"/doctor">) {
  return <RoleDashboard role="doctor">{children}</RoleDashboard>;
}
