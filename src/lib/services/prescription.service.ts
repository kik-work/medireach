import { db, nextId, save } from "@/lib/data";
import type { Prescription, PrescriptionItem } from "@/lib/types";

import { addDays, isPrescriptionValid as isValid, today, VALID_DAYS } from "@/lib/rules";

export { isValid, today, addDays, VALID_DAYS };

export const getPrescription = (id: string) => db.prescriptions.find((r) => r.id === id);

export const listForPatient = (patientId: string) =>
  db.prescriptions.filter((r) => r.patientId === patientId);

export const listForDoctor = (doctorId: string) =>
  db.prescriptions.filter((r) => r.doctorId === doctorId);

/** Medicine ids a patient may buy as Rx (from valid prescriptions, issued or uploaded). */
export function prescribedMedicineIds(patientId: string): string[] {
  return listForPatient(patientId)
    .filter(isValid)
    .flatMap((r) => r.items.map((i) => i.medicineId));
}

/** Keeps known medicines only, one row per medicine, with safe dose/days defaults. */
export function cleanItems(raw: unknown): PrescriptionItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: PrescriptionItem[] = [];
  for (const r of raw as Partial<PrescriptionItem>[]) {
    const medicineId = String(r?.medicineId ?? "");
    if (!medicineId || seen.has(medicineId) || !db.medicines.some((m) => m.id === medicineId)) continue;
    seen.add(medicineId);
    items.push({
      medicineId,
      dose: String(r.dose ?? "").trim() || "As directed",
      days: Number(r.days) > 0 ? Math.min(Math.floor(Number(r.days)), 365) : 5,
    });
  }
  return items;
}

export function createPrescription(input: {
  doctorId: string;
  patientId: string;
  diagnosis: string;
  items: PrescriptionItem[];
  issuedAt?: string;
  uploaded?: boolean;
  fileName?: string;
  doctorName?: string;
}) {
  const issuedAt = input.issuedAt && input.issuedAt <= today() ? input.issuedAt : today();
  const rx: Prescription = {
    id: nextId("rx-", db.prescriptions.map((r) => r.id)),
    doctorId: input.doctorId,
    patientId: input.patientId,
    issuedAt,
    validUntil: addDays(issuedAt, VALID_DAYS),
    diagnosis: input.diagnosis.trim(),
    items: input.items,
    ...(input.uploaded && { uploaded: true, fileName: input.fileName || undefined, doctorName: input.doctorName?.trim() || undefined }),
  };
  db.prescriptions.unshift(rx);
  save();
  return rx;
}

export function updatePrescription(id: string, patch: { diagnosis?: string; items?: PrescriptionItem[]; validUntil?: string }) {
  const rx = getPrescription(id);
  if (!rx) return undefined;
  if (patch.diagnosis !== undefined) rx.diagnosis = patch.diagnosis.trim();
  if (patch.items?.length) rx.items = patch.items;
  if (patch.validUntil && /^\d{4}-\d{2}-\d{2}$/.test(patch.validUntil) && patch.validUntil >= rx.issuedAt) rx.validUntil = patch.validUntil;
  save();
  return rx;
}

export function deletePrescription(id: string) {
  const before = db.prescriptions.length;
  db.prescriptions = db.prescriptions.filter((r) => r.id !== id);
  save();
  return db.prescriptions.length < before;
}
