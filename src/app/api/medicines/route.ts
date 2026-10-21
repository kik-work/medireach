import { NextResponse, type NextRequest } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { cleanMedicine } from "@/lib/medicine-input";
import { addMedicine, listMedicines, submitMedicine } from "@/lib/services/medicine.service";

/** GET /api/medicines?q=&category=&rx=rx|otc&rare=1 — live (doctor-approved) medicines only. */
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

/**
 * POST /api/medicines — an admin or a verified pharmacist adds a medicine.
 * It stays hidden until a verified doctor reviews and approves it. A pharmacist's proposal is tied to their account.
 */
export async function POST(req: Request) {
  const { user, res } = await guard("admin", "pharmacist");
  if (res) return res;
  const input = cleanMedicine(await readJson(req));
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 });
  if (user.role === "admin") return NextResponse.json({ data: addMedicine(input.value) }, { status: 201 });
  const result = submitMedicine(user, input.value);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value }, { status: 201 });
}
