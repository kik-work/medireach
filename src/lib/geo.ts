import { CITY_CENTER } from "@/lib/constants";
import type { Pharmacy } from "@/lib/types";

export interface Point {
  lat: number;
  lng: number;
}

/** Bangladesh bounding box, with a small margin. Catches swapped or mistyped coordinates. */
export const inBangladesh = (p: Point) => p.lat >= 20.5 && p.lat <= 26.7 && p.lng >= 88 && p.lng <= 92.7;

/** Reads "lat"/"lng" query values. Returns undefined unless both are valid and inside Bangladesh. */
export function parsePoint(lat: unknown, lng: unknown): Point | undefined {
  const p = { lat: Number(lat), lng: Number(lng) };
  if (typeof lat !== "string" || typeof lng !== "string" || !lat || !lng) return undefined;
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && inBangladesh(p) ? p : undefined;
}

/** Map position of a pharmacy: its own, or its city centre. `exact` is false for the fallback. */
export function pharmacyPoint(p: Pick<Pharmacy, "lat" | "lng" | "city">): Point & { exact: boolean } {
  return typeof p.lat === "number" && typeof p.lng === "number"
    ? { lat: p.lat, lng: p.lng, exact: true }
    : { ...CITY_CENTER[p.city], exact: false };
}

/** Great-circle distance in km (haversine). */
export function distanceKm(a: Point, b: Point) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`);
