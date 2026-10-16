import { NextResponse, type NextRequest } from "next/server";
import { listMedicines } from "@/lib/services/medicine.service";

/** GET /api/medicines?q=&category=&rx=rx|otc&rare=1 */
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const rx = p.get("rx");
  const data = listMedicines({
    q: p.get("q") ?? undefined,
    category: p.get("category") ?? undefined,
    rx: rx === "rx" || rx === "otc" ? rx : undefined,
    rareOnly: p.get("rare") === "1",
  });
  return NextResponse.json({ count: data.length, data });
}
