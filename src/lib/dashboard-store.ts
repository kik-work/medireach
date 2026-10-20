/**
 * Browser-side data for the dashboards. Seed data comes from the server; everything the
 * users change (new prescriptions, orders, admin decisions) is saved here in localStorage
 * as an "overlay" on top of the seed. Clearing site data resets it.
 */
import { notifyStore } from "@/lib/auth-store";
import type { Medicine, Order, OrderStatus, Prescription, VerificationStatus } from "@/lib/types";

export const DATA_KEY = "mr_data";

export interface Overlay {
  prescriptions: Prescription[];
  orders: Order[];
  orderStatus: Record<string, OrderStatus>;
  userStatus: Record<string, VerificationStatus>;
  pharmacyStatus: Record<string, VerificationStatus>;
  medicines: Medicine[];
}

export const EMPTY_OVERLAY: Overlay = {
  prescriptions: [],
  orders: [],
  orderStatus: {},
  userStatus: {},
  pharmacyStatus: {},
  medicines: [],
};

export function getDataSnapshot(): string | null {
  try {
    return localStorage.getItem(DATA_KEY);
  } catch {
    return null;
  }
}

export function parseOverlay(raw: string | null): Overlay {
  if (!raw) return EMPTY_OVERLAY;
  try {
    return { ...EMPTY_OVERLAY, ...(JSON.parse(raw) as Partial<Overlay>) };
  } catch {
    return EMPTY_OVERLAY;
  }
}

function update(fn: (o: Overlay) => Overlay) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(fn(parseOverlay(getDataSnapshot()))));
  } catch {
    // Storage blocked: the change is lost.
  }
  notifyStore();
}

export const addPrescription = (rx: Prescription) =>
  update((o) => ({ ...o, prescriptions: [rx, ...o.prescriptions] }));

export const addOrders = (orders: Order[]) =>
  update((o) => ({ ...o, orders: [...orders, ...o.orders] }));

export const setOrderStatus = (id: string, status: OrderStatus) =>
  update((o) => ({ ...o, orderStatus: { ...o.orderStatus, [id]: status } }));

export const setUserStatus = (id: string, status: VerificationStatus) =>
  update((o) => ({ ...o, userStatus: { ...o.userStatus, [id]: status } }));

export const setPharmacyStatus = (id: string, status: VerificationStatus) =>
  update((o) => ({ ...o, pharmacyStatus: { ...o.pharmacyStatus, [id]: status } }));

export const addMedicine = (m: Medicine) =>
  update((o) => ({ ...o, medicines: [...o.medicines, m] }));

// --- rules shared by the dashboards and the cart ---

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const isPrescriptionValid = (rx: Prescription) => rx.validUntil >= today();

/** Medicine ids a patient may buy as Rx: items of their valid prescriptions (issued or uploaded). */
export const prescribedMedicineIds = (prescriptions: Prescription[], patientId: string) =>
  prescriptions.filter((r) => r.patientId === patientId && isPrescriptionValid(r)).flatMap((r) => r.items.map((i) => i.medicineId));

/** Prescriptions visible to the cart: seed + locally saved. */
export const allPrescriptions = (seed: Prescription[], overlay: Overlay) => [...overlay.prescriptions, ...seed];
