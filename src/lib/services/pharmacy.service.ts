import { db, nextId, save } from "@/lib/data";
import type { City, Pharmacy, StockItem } from "@/lib/types";

export interface Availability {
  pharmacy: Pharmacy;
  stock: StockItem;
}

export const listPharmacies = (city?: City) =>
  db.pharmacies.filter((p) => !city || p.city === city);

export const getPharmacy = (id: string) => db.pharmacies.find((p) => p.id === id);

/**
 * Availability of a medicine, split into the user's city ("nearby") and the
 * rest of the country ("national"). Only verified pharmacies with stock count.
 */
export function getAvailability(medicineId: string, city: City) {
  const rows: Availability[] = db.stock
    .filter((s) => s.medicineId === medicineId && s.quantity > 0)
    .flatMap((s) => {
      const pharmacy = getPharmacy(s.pharmacyId);
      return pharmacy && pharmacy.status === "verified" ? [{ pharmacy, stock: s }] : [];
    })
    .sort((a, b) => a.stock.price - b.stock.price);

  return {
    nearby: rows.filter((r) => r.pharmacy.city === city),
    national: rows.filter((r) => r.pharmacy.city !== city),
  };
}

export const getInventory = (pharmacyId: string) =>
  db.stock.filter((s) => s.pharmacyId === pharmacyId);

export type PharmacyInput = Pick<Pharmacy, "name" | "city" | "area" | "address" | "phone" | "licenseNo">;

export function createPharmacy(input: PharmacyInput): Pharmacy {
  const pharmacy: Pharmacy = { ...input, id: nextId("ph", db.pharmacies.map((p) => p.id)), rating: 0, status: "pending" };
  db.pharmacies.push(pharmacy);
  return pharmacy;
}

export function updatePharmacy(id: string, patch: Partial<PharmacyInput>) {
  const p = getPharmacy(id);
  if (!p) return undefined;
  for (const key of ["name", "area", "address", "phone", "licenseNo"] as const) {
    const v = patch[key];
    if (typeof v === "string" && (v.trim() || key === "area")) p[key] = v.trim();
  }
  if (patch.city) p.city = patch.city;
  save();
  return p;
}

export function setPharmacyStatus(id: string, status: Pharmacy["status"]) {
  const p = getPharmacy(id);
  if (p) {
    p.status = status;
    save();
  }
  return p;
}

export function updateStock(pharmacyId: string, medicineId: string, quantity: number, price: number) {
  const existing = db.stock.find((s) => s.pharmacyId === pharmacyId && s.medicineId === medicineId);
  if (existing) Object.assign(existing, { quantity, price });
  else db.stock.push({ pharmacyId, medicineId, quantity, price });
  save();
}

export function removeStock(pharmacyId: string, medicineId: string) {
  const before = db.stock.length;
  db.stock = db.stock.filter((s) => !(s.pharmacyId === pharmacyId && s.medicineId === medicineId));
  save();
  return db.stock.length < before;
}

/** Stock summary across verified pharmacies — used on medicine cards. */
export function getStockSummary(medicineId: string) {
  const rows = db.stock.filter((s) => {
    if (s.medicineId !== medicineId || s.quantity <= 0) return false;
    return getPharmacy(s.pharmacyId)?.status === "verified";
  });
  const cities = new Set(rows.map((r) => getPharmacy(r.pharmacyId)!.city));
  return {
    pharmacies: rows.length,
    cities: cities.size,
    minPrice: rows.length ? Math.min(...rows.map((r) => r.price)) : null,
  };
}
