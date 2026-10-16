import Link from "next/link";
import { FileText, ShieldCheck, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PrescriptionCard } from "@/components/dashboard/prescription-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { requireRole } from "@/lib/auth";
import { listForDoctor } from "@/lib/services/prescription.service";

export const metadata = { title: "Doctor dashboard" };

export default async function DoctorHome() {
  const user = await requireRole("doctor");
  const rxs = listForDoctor(user.id);
  return (
    <>
      <PageHeader title={user.name} description={`Verified · ${user.registrationNo}`}
        actions={<Link href="/doctor/prescriptions/new" className={buttonVariants()}>New prescription</Link>} />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Prescriptions issued" value={rxs.length} icon={FileText} />
        <StatCard label="Patients" value={new Set(rxs.map((r) => r.patientId)).size} icon={Users} />
        <StatCard label="Registration" value="BMDC ✓" icon={ShieldCheck} hint="Verified by admin" />
      </div>
      <h2 className="mb-3 font-semibold">Latest prescription</h2>
      {rxs[0] ? <PrescriptionCard rx={rxs[0]} party="doctor" /> : <p className="text-sm text-muted-foreground">None yet.</p>}
    </>
  );
}
