import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { createRefill, listRefills, type RefillInput } from "@/lib/services/refill.service";

/** GET /api/refills — the patient's refill subscriptions. */
export async function GET() {
  const { user, res } = await guard("patient");
  if (res) return res;
  return NextResponse.json({ data: listRefills(user.id) }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/refills { medicineId, pharmacyId, quantity, everyDays } — subscribe to a chronic-medicine refill. */
export async function POST(req: Request) {
  const { user, res } = await guard("patient");
  if (res) return res;
  const result = createRefill(user.id, await readJson<RefillInput>(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ data: result.refill }, { status: 201 });
}
