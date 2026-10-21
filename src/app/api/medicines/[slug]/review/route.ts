import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { cleanReview } from "@/lib/medicine-input";
import { findMedicine, reviewMedicine } from "@/lib/services/medicine.service";

/**
 * POST /api/medicines/:slugOrId/review { decision: "approve"|"reject", note?, description, uses, cautions, sideEffects, interactions[] }
 * A verified doctor approves a pending medicine (supplying its AI caution data) or rejects it with a reason.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/medicines/[slug]/review">) {
  const { user, res } = await guard("doctor");
  if (res) return res;
  const medicine = findMedicine((await ctx.params).slug);
  if (!medicine) return NextResponse.json({ error: "Medicine not found." }, { status: 404 });
  const input = cleanReview(await readJson(req));
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 });
  const result = reviewMedicine(medicine.id, user, input.value);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value });
}
