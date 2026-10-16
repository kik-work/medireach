import { PrescriptionCard } from "@/components/dashboard/prescription-card";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth";
import { listForDoctor } from "@/lib/services/prescription.service";

export const metadata = { title: "Prescription history" };

export default async function DoctorPrescriptions() {
  const user = await requireRole("doctor");
  return (
    <>
      <PageHeader title="Prescription history" />
      <div className="space-y-4">
        {listForDoctor(user.id).map((rx) => <PrescriptionCard key={rx.id} rx={rx} party="doctor" />)}
      </div>
    </>
  );
}
