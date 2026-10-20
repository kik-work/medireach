import { db, nextId, save } from "@/lib/data";
import type { Refill } from "@/lib/types";
import { getMedicineById } from "./medicine.service";
import { placeOrder, type PlaceOrderResult } from "./order.service";
import { getPharmacy } from "./pharmacy.service";
import { addDays, today } from "./prescription.service";

export const listRefills = (patientId: string) => db.refills.filter((r) => r.patientId === patientId);
export const getRefill = (id: string) => db.refills.find((r) => r.id === id);

export type RefillInput = { medicineId?: string; pharmacyId?: string; quantity?: number; everyDays?: number };

export function createRefill(patientId: string, input: RefillInput): { ok: true; refill: Refill } | { ok: false; error: string } {
  if (!input.medicineId || !getMedicineById(input.medicineId)) return { ok: false, error: "Choose a medicine." };
  if (getPharmacy(input.pharmacyId ?? "")?.status !== "verified") return { ok: false, error: "Choose a verified pharmacy." };
  const refill: Refill = {
    id: nextId("rf-", db.refills.map((r) => r.id)),
    patientId,
    medicineId: input.medicineId,
    pharmacyId: input.pharmacyId!,
    quantity: Math.max(1, Math.floor(Number(input.quantity)) || 1),
    everyDays: Math.min(365, Math.max(1, Math.floor(Number(input.everyDays)) || 30)),
    nextDate: "",
    active: true,
  };
  refill.nextDate = addDays(today(), refill.everyDays);
  db.refills.push(refill);
  save();
  return { ok: true, refill };
}

export function updateRefill(id: string, patch: { quantity?: number; everyDays?: number; pharmacyId?: string; active?: boolean }) {
  const r = getRefill(id);
  if (!r) return undefined;
  if (patch.quantity !== undefined) r.quantity = Math.max(1, Math.floor(Number(patch.quantity)) || r.quantity);
  if (patch.everyDays !== undefined) r.everyDays = Math.min(365, Math.max(1, Math.floor(Number(patch.everyDays)) || r.everyDays));
  if (patch.pharmacyId && getPharmacy(patch.pharmacyId)?.status === "verified") r.pharmacyId = patch.pharmacyId;
  if (typeof patch.active === "boolean") r.active = patch.active;
  save();
  return r;
}

export function deleteRefill(id: string) {
  const before = db.refills.length;
  db.refills = db.refills.filter((r) => r.id !== id);
  save();
  return db.refills.length < before;
}

/** Places the refill order now and schedules the next one. */
export function orderRefillNow(id: string): PlaceOrderResult {
  const r = getRefill(id);
  if (!r) return { ok: false, error: "Refill not found." };
  const result = placeOrder(r.patientId, [{ medicineId: r.medicineId, pharmacyId: r.pharmacyId, quantity: r.quantity }]);
  if (result.ok) {
    r.nextDate = addDays(today(), r.everyDays);
    save();
  }
  return result;
}
