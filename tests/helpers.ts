import { db, resetDb } from "@/lib/data";
import { addDays, today } from "@/lib/rules";
import type { Prescription } from "@/lib/types";

export const PATIENT = "u-pat1";
export const PHARMACY = "ph3";

/** Fresh sample data, with no prescriptions, orders or refills for the test patient. */
export function freshDb() {
  resetDb();
  db.prescriptions = db.prescriptions.filter((r) => r.patientId !== PATIENT);
  db.orders = db.orders.filter((o) => o.patientId !== PATIENT);
  db.refills = db.refills.filter((r) => r.patientId !== PATIENT);
}

export function setStock(medicineId: string, quantity: number, price = 10, pharmacyId = PHARMACY) {
  const row = db.stock.find((s) => s.pharmacyId === pharmacyId && s.medicineId === medicineId);
  if (row) Object.assign(row, { quantity, price });
  else db.stock.push({ pharmacyId, medicineId, quantity, price });
}

export const stockOf = (medicineId: string, pharmacyId = PHARMACY) =>
  db.stock.find((s) => s.pharmacyId === pharmacyId && s.medicineId === medicineId)?.quantity;

/** A doctor-issued prescription for the test patient. */
export function prescribe(medicineIds: string[], opts: Partial<Prescription> = {}) {
  const rx: Prescription = {
    id: `rx-test-${db.prescriptions.length + 1}`,
    doctorId: db.users.find((u) => u.role === "doctor")!.id,
    patientId: PATIENT,
    issuedAt: today(),
    validUntil: addDays(today(), 10),
    diagnosis: "Test",
    items: medicineIds.map((medicineId) => ({ medicineId, dose: "1+0+1", days: 10 })),
    ...opts,
  };
  db.prescriptions.push(rx);
  return rx;
}
