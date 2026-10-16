import { db } from "@/lib/data";
import type { Prescription, PrescriptionItem } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export const isValid = (rx: Prescription) => rx.validUntil >= today();

export const listForPatient = (patientId: string) =>
  db.prescriptions.filter((r) => r.patientId === patientId);

export const listForDoctor = (doctorId: string) =>
  db.prescriptions.filter((r) => r.doctorId === doctorId);

/** Medicine ids a patient may buy as Rx (from valid prescriptions). */
export function prescribedMedicineIds(patientId: string): string[] {
  return listForPatient(patientId)
    .filter(isValid)
    .flatMap((r) => r.items.map((i) => i.medicineId));
}

export function createPrescription(input: {
  doctorId: string;
  patientId: string;
  diagnosis: string;
  items: PrescriptionItem[];
}) {
  const issued = new Date();
  const until = new Date(issued.getTime() + 30 * 24 * 3600 * 1000);
  const rx: Prescription = {
    id: `rx-${1000 + db.prescriptions.length + 1}`,
    issuedAt: issued.toISOString().slice(0, 10),
    validUntil: until.toISOString().slice(0, 10),
    ...input,
  };
  db.prescriptions.unshift(rx);
  return rx;
}
