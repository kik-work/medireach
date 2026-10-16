import { db } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";
import { getMedicineById } from "./medicine.service";
import { prescribedMedicineIds } from "./prescription.service";

export interface CartLineInput {
  medicineId: string;
  pharmacyId: string;
  quantity: number;
}

export const listOrders = (filter: { patientId?: string; pharmacyId?: string } = {}) =>
  db.orders
    .filter((o) => (!filter.patientId || o.patientId === filter.patientId) && (!filter.pharmacyId || o.pharmacyId === filter.pharmacyId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export type PlaceOrderResult =
  | { ok: true; orders: Order[] }
  | { ok: false; error: string; blocked?: string[] };

/**
 * Places one order per pharmacy. Rx-only medicines are rejected unless the
 * patient holds a valid prescription for them (prescription bridge).
 */
export function placeOrder(patientId: string, lines: CartLineInput[]): PlaceOrderResult {
  if (lines.length === 0) return { ok: false, error: "Cart is empty." };

  const allowed = new Set(prescribedMedicineIds(patientId));
  const blocked = lines
    .map((l) => getMedicineById(l.medicineId))
    .filter((m) => m?.rx && !allowed.has(m.id))
    .map((m) => m!.brand);
  if (blocked.length) {
    return { ok: false, error: "A valid prescription is required for Rx-only medicines.", blocked };
  }

  const byPharmacy = Map.groupBy(lines, (l) => l.pharmacyId);
  const created: Order[] = [];
  for (const [pharmacyId, group] of byPharmacy) {
    const orderLines = group.map((l) => {
      const s = db.stock.find((x) => x.pharmacyId === pharmacyId && x.medicineId === l.medicineId);
      return { medicineId: l.medicineId, quantity: l.quantity, unitPrice: s?.price ?? getMedicineById(l.medicineId)?.price ?? 0 };
    });
    const order: Order = {
      id: `ORD-${2000 + db.orders.length + 1}`,
      patientId,
      pharmacyId,
      lines: orderLines,
      total: orderLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
      status: "placed",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.orders.unshift(order);
    created.push(order);
  }
  return { ok: true, orders: created };
}

export function setOrderStatus(id: string, status: OrderStatus) {
  const o = db.orders.find((x) => x.id === id);
  if (o) o.status = status;
}
