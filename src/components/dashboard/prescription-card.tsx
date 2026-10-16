import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMedicineById } from "@/lib/services/medicine.service";
import { isValid } from "@/lib/services/prescription.service";
import { getUser } from "@/lib/services/user.service";
import type { Prescription } from "@/lib/types";

export function PrescriptionCard({ rx, party }: { rx: Prescription; party: "doctor" | "patient" }) {
  const valid = isValid(rx);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {rx.id}
          <Badge variant={valid ? "default" : "outline"}>{valid ? "Valid" : "Expired"}</Badge>
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {party === "doctor" ? `Patient: ${getUser(rx.patientId)?.name}` : `By ${getUser(rx.doctorId)?.name}`} · {rx.issuedAt} → {rx.validUntil}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">Diagnosis: {rx.diagnosis || "—"}</p>
        <ul className="divide-y rounded-lg border">
          {rx.items.map((i) => {
            const m = getMedicineById(i.medicineId);
            return (
              <li key={i.medicineId} className="flex justify-between gap-4 p-2.5">
                <span className="font-medium">{m?.brand} {m?.strength} <span className="font-normal text-muted-foreground">({m?.generic})</span></span>
                <span className="text-muted-foreground">{i.dose} · {i.days} days</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
