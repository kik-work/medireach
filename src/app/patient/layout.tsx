import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function PatientLayout({ children }: LayoutProps<"/patient">) {
  return <RoleDashboard role="patient">{children}</RoleDashboard>;
}
