import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { reviewPrescription } from "@/lib/services/prescription.service";

/**
 * POST /api/prescriptions/:id/review { decision: "approve" | "reject", note? } — admin checks an uploaded copy.
 * A rejection needs a note; the patient sees it.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/prescriptions/[id]/review">) {
  const { user, res } = await guard("admin");
  if (res) return res;
  const body = await readJson<{ decision?: unknown; note?: unknown }>(req);
  const result = reviewPrescription((await ctx.params).id, user, body.decision, body.note);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value });
}
