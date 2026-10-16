import { NextResponse, type NextRequest } from "next/server";
import { CITIES, DEFAULT_CITY } from "@/lib/constants";
import { getMedicineBySlug } from "@/lib/services/medicine.service";
import { getAvailability } from "@/lib/services/pharmacy.service";
import type { City } from "@/lib/types";

/** GET /api/medicines/:slug/availability?city=Dhaka — nearby first, then national. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/medicines/[slug]/availability">) {
  const { slug } = await ctx.params;
  const medicine = getMedicineBySlug(slug);
  if (!medicine) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });

  const requested = req.nextUrl.searchParams.get("city") as City | null;
  const city = requested && CITIES.includes(requested) ? requested : DEFAULT_CITY;
  return NextResponse.json({ medicine: medicine.brand, city, ...getAvailability(medicine.id, city) });
}
