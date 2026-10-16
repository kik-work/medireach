import { PrescriptionCard } from "@/components/dashboard/prescription-card";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth";
import { listForPatient } from "@/lib/services/prescription.service";

export const metadata = { title: "My prescriptions" };

export default async function PatientPrescriptions() {
  const user = await requireRole("patient");
  const rxs = listForPatient(user.id);
  return (
    <>
      <PageHeader title="My prescriptions" description="Prescriptions issued by verified doctors. Rx-only medicines in your cart are checked against these." />
      <div className="space-y-4">
        {rxs.length === 0 && <p className="text-sm text-muted-foreground">No prescriptions yet.</p>}
        {rxs.map((rx) => <PrescriptionCard key={rx.id} rx={rx} party="patient" />)}
      </div>
    </>
  );
}
