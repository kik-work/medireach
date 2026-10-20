import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getRefill, orderRefillNow } from "@/lib/services/refill.service";

/** POST /api/refills/:id/order — place this refill's order now and schedule the next one. */
export async function POST(_req: Request, ctx: RouteContext<"/api/refills/[id]/order">) {
  const { user, res } = await guard("patient");
  if (res) return res;
  const refill = getRefill((await ctx.params).id);
  if (!refill || refill.patientId !== user.id) return NextResponse.json({ ok: false, error: "Refill not found." }, { status: 404 });
  if (user.status !== "verified") return NextResponse.json({ ok: false, error: "Your account is suspended." }, { status: 403 });
  const result = orderRefillNow(refill.id);
  return NextResponse.json(result, { status: result.ok ? 201 : 422 });
}
