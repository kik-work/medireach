import { db, nextId, save } from "@/lib/data";
import type { Order, OrderStatus, Role, User } from "@/lib/types";
import { getMedicineById } from "./medicine.service";
import { getPharmacy } from "./pharmacy.service";
import { prescribedMedicineIds, today } from "./prescription.service";

export interface CartLineInput {
  medicineId: string;
  pharmacyId: string;
  quantity: number;
}

export const listOrders = (filter: { patientId?: string; pharmacyId?: string } = {}) =>
  db.orders
    .filter((o) => (!filter.patientId || o.patientId === filter.patientId) && (!filter.pharmacyId || o.pharmacyId === filter.pharmacyId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

export type PlaceOrderResult =
  | { ok: true; orders: Order[] }
  | { ok: false; error: string; blocked?: string[] };

/**
 * Places one order per pharmacy. Rx-only medicines are rejected unless the patient holds
 * a valid prescription for them (prescription bridge). A pharmacy that cannot cover every
 * line from stock gets a "pre-order" instead of a "placed" order.
 */
export function placeOrder(patientId: string, lines: CartLineInput[]): PlaceOrderResult {
  const clean = lines
    .map((l) => ({ ...l, quantity: Math.floor(Number(l.quantity)) }))
    .filter((l) => l.quantity > 0 && getMedicineById(l.medicineId));
  if (clean.length === 0) return { ok: false, error: "Cart is empty." };

  const closed = clean.find((l) => getPharmacy(l.pharmacyId)?.status !== "verified");
  if (closed) return { ok: false, error: "One of the pharmacies in your cart is not available for orders." };

  const allowed = new Set(prescribedMedicineIds(patientId));
  const blocked = [...new Set(clean.map((l) => getMedicineById(l.medicineId)!).filter((m) => m.rx && !allowed.has(m.id)).map((m) => m.brand))];
  if (blocked.length) {
    return { ok: false, error: "A valid prescription is required for Rx-only medicines.", blocked };
  }

  const ids = db.orders.map((o) => o.id);
  const created: Order[] = [];
  for (const [pharmacyId, group] of Map.groupBy(clean, (l) => l.pharmacyId)) {
    const orderLines = group.map((l) => {
      const s = db.stock.find((x) => x.pharmacyId === pharmacyId && x.medicineId === l.medicineId);
      return { medicineId: l.medicineId, quantity: l.quantity, unitPrice: s?.price ?? getMedicineById(l.medicineId)!.price };
    });
    const inStock = group.every((l) => {
      const s = db.stock.find((x) => x.pharmacyId === pharmacyId && x.medicineId === l.medicineId);
      return s && s.quantity >= l.quantity;
    });
    if (inStock) {
      for (const l of group) db.stock.find((x) => x.pharmacyId === pharmacyId && x.medicineId === l.medicineId)!.quantity -= l.quantity;
    }
    const id = nextId("ORD-", ids);
    ids.push(id);
    const order: Order = {
      id,
      patientId,
      pharmacyId,
      lines: orderLines,
      total: orderLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
      status: inStock ? "placed" : "pre-order",
      createdAt: today(),
      reserved: inStock,
    };
    db.orders.unshift(order);
    created.push(order);
  }
  save();
  return { ok: true, orders: created };
}

const FINAL: OrderStatus[] = ["delivered", "cancelled"];
const ADVANCE: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "confirmed",
  "pre-order": "confirmed",
  confirmed: "packed",
  packed: "delivered",
};

export type StatusResult = { ok: true; order: Order } | { ok: false; error: string; code: 403 | 404 | 422 };

/**
 * Who may do what:
 * - pharmacist of the order's pharmacy: advance one step, or cancel (needs a verified pharmacist)
 * - patient (owner): cancel while the order is still "placed" or "pre-order"
 * - admin: cancel any order that is not finished
 */
export function changeOrderStatus(id: string, next: OrderStatus, actor: Pick<User, "id" | "role" | "pharmacyId" | "status">): StatusResult {
  const order = db.orders.find((o) => o.id === id);
  if (!order) return { ok: false, error: "Order not found.", code: 404 };
  if (FINAL.includes(order.status)) return { ok: false, error: `Order is already ${order.status}.`, code: 422 };

  const role: Role = actor.role;
  if (role === "patient") {
    if (order.patientId !== actor.id) return { ok: false, error: "Not your order.", code: 403 };
    if (next !== "cancelled" || !["placed", "pre-order"].includes(order.status)) {
      return { ok: false, error: "You can only cancel an order the pharmacy has not confirmed yet.", code: 422 };
    }
  } else if (role === "pharmacist") {
    if (order.pharmacyId !== actor.pharmacyId) return { ok: false, error: "Not an order of your pharmacy.", code: 403 };
    if (actor.status !== "verified") return { ok: false, error: "Your account must be verified to handle orders.", code: 403 };
    if (next !== "cancelled" && ADVANCE[order.status] !== next) return { ok: false, error: "Orders move one step at a time.", code: 422 };
  } else if (role === "admin") {
    if (next !== "cancelled") return { ok: false, error: "Admins can only cancel orders.", code: 422 };
  } else {
    return { ok: false, error: "Not allowed.", code: 403 };
  }

  if (FINAL.includes(order.status)) return { ok: false, error: `Order is already ${order.status}.`, code: 422 };

  if (next === "cancelled" && order.reserved) {
    for (const l of order.lines) {
      const s = db.stock.find((x) => x.pharmacyId === order.pharmacyId && x.medicineId === l.medicineId);
      if (s) s.quantity += l.quantity;
    }
    order.reserved = false;
  }
  order.status = next;
  save();
  return { ok: true, order };
}
