import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { deleteRefill, getRefill, updateRefill } from "@/lib/services/refill.service";

async function ownRefill(id: string) {
  const { user, res } = await guard("patient");
  if (res) return { res };
  const refill = getRefill(id);
  if (!refill) return { res: NextResponse.json({ error: "Refill not found." }, { status: 404 }) };
  if (refill.patientId !== user.id) return { res: NextResponse.json({ error: "Not your refill." }, { status: 403 }) };
  return { refill };
}

/** PATCH /api/refills/:id { quantity?, everyDays?, pharmacyId?, active? } — edit, pause or resume. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/refills/[id]">) {
  const own = await ownRefill((await ctx.params).id);
  if (own.res) return own.res;
  return NextResponse.json({ data: updateRefill(own.refill.id, await readJson(req)) });
}

/** DELETE /api/refills/:id — unsubscribe. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/refills/[id]">) {
  const own = await ownRefill((await ctx.params).id);
  if (own.res) return own.res;
  deleteRefill(own.refill.id);
  return NextResponse.json({ data: null });
}
