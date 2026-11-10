import { db, nextId, save } from "@/lib/data";
import { NEARBY_KM } from "@/lib/constants";
import { distanceKm, inBangladesh, pharmacyPoint, type Point } from "@/lib/geo";
import type { City, Pharmacy, StockItem, User } from "@/lib/types";

export interface Availability {
  pharmacy: Pharmacy;
  stock: StockItem;
  /** Distance from the user, when they shared their location. */
  distanceKm?: number;
  /** false = the pharmacy has no map position, so the distance is to its city centre. */
  exact?: boolean;
}

export const listPharmacies = (city?: City) =>
  db.pharmacies.filter((p) => !city || p.city === city);

export const getPharmacy = (id: string) => db.pharmacies.find((p) => p.id === id);

/** Verified pharmacies, nearest first, with their distance from `origin`. */
export function pharmaciesNear(origin: Point) {
  return db.pharmacies
    .filter((p) => p.status === "verified")
    .map((pharmacy) => {
      const point = pharmacyPoint(pharmacy);
      return { pharmacy, distanceKm: distanceKm(origin, point), exact: point.exact };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Availability of a medicine. Only verified pharmacies with stock count.
 * - With `origin` (the user's location): "nearby" = within NEARBY_KM, nearest first; "national" = the rest, by distance.
 * - Without: "nearby" = the user's city, cheapest first; "national" = other cities.
 */
export function getAvailability(medicineId: string, city: City, origin?: Point) {
  const rows: Availability[] = db.stock
    .filter((s) => s.medicineId === medicineId && s.quantity > 0)
    .flatMap((s) => {
      const pharmacy = getPharmacy(s.pharmacyId);
      return pharmacy && pharmacy.status === "verified" ? [{ pharmacy, stock: s }] : [];
    })
    .sort((a, b) => a.stock.price - b.stock.price);

  if (origin) {
    const measured = rows
      .map((r) => {
        const point = pharmacyPoint(r.pharmacy);
        return { ...r, distanceKm: distanceKm(origin, point), exact: point.exact };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm || a.stock.price - b.stock.price);
    return {
      mode: "location" as const,
      nearby: measured.filter((r) => r.distanceKm <= NEARBY_KM),
      national: measured.filter((r) => r.distanceKm > NEARBY_KM),
    };
  }

  return {
    mode: "city" as const,
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

/** Map position patch: both numbers inside Bangladesh, or both null to clear. */
export type LocationPatch = { lat?: unknown; lng?: unknown };

export function checkLocation(patch: LocationPatch): { ok: true; value?: { lat?: number; lng?: number } } | { ok: false; error: string } {
  if (patch.lat === undefined && patch.lng === undefined) return { ok: true };
  if (patch.lat === null && patch.lng === null) return { ok: true, value: { lat: undefined, lng: undefined } };
  const point = { lat: Number(patch.lat), lng: Number(patch.lng) };
  if (typeof patch.lat !== "number" || typeof patch.lng !== "number" || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || !inBangladesh(point)) {
    return { ok: false, error: "Enter a latitude and longitude inside Bangladesh (for example 23.7461, 90.3742)." };
  }
  return { ok: true, value: { lat: Math.round(point.lat * 1e6) / 1e6, lng: Math.round(point.lng * 1e6) / 1e6 } };
}

export function updatePharmacy(id: string, patch: Partial<PharmacyInput>, location?: { lat?: number; lng?: number }) {
  const p = getPharmacy(id);
  if (!p) return undefined;
  for (const key of ["name", "area", "address", "phone", "licenseNo"] as const) {
    const v = patch[key];
    if (typeof v === "string" && (v.trim() || key === "area")) p[key] = v.trim();
  }
  if (patch.city) p.city = patch.city;
  if (location) {
    if (location.lat === undefined) {
      delete p.lat;
      delete p.lng;
    } else {
      Object.assign(p, location);
    }
  }
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

/**
 * Who may change a pharmacy's listings: a verified pharmacist, or a pending one while the pharmacy
 * is not live yet (so they can prepare inventory before approval). Rejected or suspended accounts
 * never can, and an unverified account cannot change a pharmacy customers already see.
 */
export function stockEditError(user: Pick<User, "status" | "pharmacyId">): string | null {
  const pharmacy = user.pharmacyId ? getPharmacy(user.pharmacyId) : undefined;
  if (!pharmacy) return "No pharmacy is linked to your account.";
  if (user.status === "verified") return null;
  if (user.status === "pending" && pharmacy.status !== "verified") return null;
  return user.status === "pending"
    ? "Your pharmacist registration must be verified before you can change a live pharmacy's stock."
    : `Your pharmacist account is ${user.status}. Contact the MediReach admin team.`;
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
