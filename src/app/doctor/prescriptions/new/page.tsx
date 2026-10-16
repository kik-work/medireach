import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { issuePrescription } from "@/lib/actions/doctor";
import { requireRole } from "@/lib/auth";
import { listMedicines } from "@/lib/services/medicine.service";
import { listUsers } from "@/lib/services/user.service";

export const metadata = { title: "New prescription" };

const selectClass = "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm";
const SLOTS = 3;

export default async function NewPrescription() {
  await requireRole("doctor");
  const patients = listUsers("patient");
  const medicines = listMedicines();

  return (
    <>
      <PageHeader title="New prescription" description="Prescribed medicines become purchasable for the patient (valid 30 days)." />
      <Card className="max-w-3xl">
        <CardContent>
          <form action={issuePrescription} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="patientId">Patient</Label>
                <select id="patientId" name="patientId" required className={selectClass}>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input id="diagnosis" name="diagnosis" placeholder="e.g. Hypertension" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Medicines</Label>
              {Array.from({ length: SLOTS }, (_, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_90px]">
                  <select name="medicineId" defaultValue="" required={i === 0} className={selectClass}>
                    <option value="">{i === 0 ? "Select medicine…" : "(optional)"}</option>
                    {medicines.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.strength} — {m.generic}{m.rx ? " (Rx)" : ""}</option>)}
                  </select>
                  <Input name="dose" placeholder="Dose, e.g. 1 tab twice daily" />
                  <Input name="days" type="number" min={1} placeholder="Days" />
                </div>
              ))}
            </div>

            <Button type="submit">Issue prescription</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
