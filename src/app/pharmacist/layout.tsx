import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export const metadata = { title: "Pharmacist" };

export default function PharmacistLayout({ children }: LayoutProps<"/pharmacist">) {
  return <RoleDashboard role="pharmacist">{children}</RoleDashboard>;
}
