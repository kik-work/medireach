import { db, nextId, save } from "@/lib/data";
import { removeUpload } from "@/lib/uploads";
import type { Prescription, PrescriptionItem, User } from "@/lib/types";

import { addDays, isMedicineLive, isPrescriptionValid as isValid, today, VALID_DAYS } from "@/lib/rules";

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
    if (!medicineId || seen.has(medicineId) || !db.medicines.some((m) => m.id === medicineId && isMedicineLive(m))) continue;
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
  fileType?: string;
  doctorName?: string;
  appointmentId?: string;
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
    ...(input.appointmentId && { appointmentId: input.appointmentId }),
    // An uploaded copy waits for an admin before it unlocks Rx medicines.
    ...(input.uploaded && {
      uploaded: true,
      fileName: input.fileName || undefined,
      fileType: input.fileType || undefined,
      doctorName: input.doctorName?.trim() || undefined,
      review: { status: "pending" as const },
    }),
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
  removeUpload(id);
  return db.prescriptions.length < before;
}

/** Uploaded copies an admin has not checked yet, oldest first. */
export const listPendingUploads = () =>
  db.prescriptions.filter((r) => r.uploaded && r.review?.status === "pending").sort((a, b) => a.id.localeCompare(b.id));

export type RxReviewResult = { ok: true; value: Prescription } | { ok: false; error: string; status: number };

/**
 * An admin checks an uploaded copy against its file.
 * Approve: its medicines become purchasable while it is in date. Reject: the patient sees the reason.
 */
export function reviewPrescription(id: string, admin: User, decision: unknown, note: unknown): RxReviewResult {
  if (admin.role !== "admin") return { ok: false, error: "Only an admin can review uploaded prescriptions.", status: 403 };
  const rx = getPrescription(id);
  if (!rx || !rx.uploaded) return { ok: false, error: "Uploaded prescription not found.", status: 404 };
  if (decision !== "approve" && decision !== "reject") return { ok: false, error: "Choose approve or reject.", status: 422 };
  const reason = typeof note === "string" ? note.trim().slice(0, 300) : "";
  if (decision === "reject" && !reason) return { ok: false, error: "Give the patient a reason for the rejection.", status: 422 };
  if (decision === "approve" && !rx.fileType) return { ok: false, error: "No file is stored, so there is nothing to check. Reject it instead.", status: 422 };
  rx.review = {
    status: decision === "approve" ? "approved" : "rejected",
    reviewedBy: admin.id,
    reviewedAt: today(),
    note: reason || undefined,
  };
  save();
  return { ok: true, value: rx };
}
