import Link from "next/link";
import { BadgeCheck, Package, Pill, Sparkles, Store, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { formatBDT } from "@/lib/constants";
import { getPlatformStats } from "@/lib/services/admin.service";

export default function AdminHome() {
  const s = getPlatformStats();
  return (
    <>
      <PageHeader title="Admin overview" description="Compliance and platform management. Only reachable from localhost." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Medicines" value={s.medicines} icon={Pill} hint={`${s.rareMedicines} rare`} />
        <StatCard label="Verified pharmacies" value={s.pharmacies} icon={Store} />
        <StatCard label="Verified doctors" value={s.doctors} icon={Users} />
        <StatCard label="Orders" value={s.orders} icon={Package} />
        <StatCard label="Order value" value={formatBDT(s.revenue)} icon={Wallet} />
        <StatCard label="Pending verifications" value={s.pendingVerifications} icon={BadgeCheck} />
        <StatCard label="Caution rules" value="8 pairs" icon={Sparkles} hint="interaction table" />
      </div>
      <Card className="mt-8">
        <CardHeader><CardTitle>Needs attention</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <p>{s.pendingVerifications} doctor / pharmacist / pharmacy registrations are waiting for review.</p>
          <Link href="/admin/verifications" className={buttonVariants({ size: "sm" })}>Review</Link>
        </CardContent>
      </Card>
    </>
  );
}
