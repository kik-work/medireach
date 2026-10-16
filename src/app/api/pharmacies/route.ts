import { NextResponse, type NextRequest } from "next/server";
import { CITIES } from "@/lib/constants";
import { listPharmacies } from "@/lib/services/pharmacy.service";
import type { City } from "@/lib/types";

/** GET /api/pharmacies?city=Dhaka — verified pharmacies only (public). */
export function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") as City | null;
  const data = listPharmacies(city && CITIES.includes(city) ? city : undefined).filter((p) => p.status === "verified");
  return NextResponse.json({ count: data.length, data });
}
