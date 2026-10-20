import { NextResponse, type NextRequest } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { cleanMedicine } from "@/lib/medicine-input";
import { addMedicine, listMedicines } from "@/lib/services/medicine.service";

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

/** POST /api/medicines — admin adds a medicine to the curated database. */
export async function POST(req: Request) {
  const { res } = await guard("admin");
  if (res) return res;
  const input = cleanMedicine(await readJson(req));
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 });
  return NextResponse.json({ data: addMedicine(input.value) }, { status: 201 });
}
