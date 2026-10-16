import { db } from "@/lib/data";
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

export function setPharmacyStatus(id: string, status: Pharmacy["status"]) {
  const p = getPharmacy(id);
  if (p) p.status = status;
}

export function updateStock(pharmacyId: string, medicineId: string, quantity: number, price: number) {
  const existing = db.stock.find((s) => s.pharmacyId === pharmacyId && s.medicineId === medicineId);
  if (existing) Object.assign(existing, { quantity, price });
  else db.stock.push({ pharmacyId, medicineId, quantity, price });
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
