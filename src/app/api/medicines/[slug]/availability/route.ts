import { NextResponse, type NextRequest } from "next/server";
import { CITIES, DEFAULT_CITY } from "@/lib/constants";
import { parsePoint } from "@/lib/geo";
import { getMedicineBySlug } from "@/lib/services/medicine.service";
import { getAvailability } from "@/lib/services/pharmacy.service";
import type { City } from "@/lib/types";

/**
 * GET /api/medicines/:slug/availability?city=Dhaka[&lat=23.75&lng=90.37]
 * With lat/lng: pharmacies within 10 km first (nearest first), then the rest of the country by distance.
 * Without: the city first, then other cities.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/medicines/[slug]/availability">) {
  const { slug } = await ctx.params;
  const medicine = getMedicineBySlug(slug);
  if (!medicine) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });

  const p = req.nextUrl.searchParams;
  const requested = p.get("city") as City | null;
  const city = requested && CITIES.includes(requested) ? requested : DEFAULT_CITY;
  const origin = parsePoint(p.get("lat"), p.get("lng"));
  return NextResponse.json({ medicine: medicine.brand, city, ...getAvailability(medicine.id, city, origin) });
}
