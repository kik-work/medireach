import type { Medicine, Prescription } from "@/lib/types";

/** Date and prescription rules shared by the server and the dashboards. */
export const VALID_DAYS = 30;

export const today = () => new Date().toISOString().slice(0, 10);

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A medicine is live (listed, orderable, prescribable) once a verified doctor approved it. */
export const isMedicineLive = (m: Pick<Medicine, "review">) => !m.review || m.review.status === "approved";

export const isPrescriptionValid = (rx: Prescription) => rx.validUntil >= today();

/** Medicine ids a patient may buy as Rx: items of their valid prescriptions (issued or uploaded). */
export const prescribedMedicineIds = (prescriptions: Prescription[], patientId: string) =>
  prescriptions.filter((r) => r.patientId === patientId && isPrescriptionValid(r)).flatMap((r) => r.items.map((i) => i.medicineId));
