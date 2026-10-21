import { NextResponse, type NextRequest } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { cleanMedicine } from "@/lib/medicine-input";
import { deleteMedicine, findMedicine, getMedicineBySlug, resubmitMedicine, updateMedicine } from "@/lib/services/medicine.service";

/** GET /api/medicines/:slug — live (doctor-approved) medicines only. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/medicines/[slug]">) {
  const { slug } = await ctx.params;
  const medicine = getMedicineBySlug(slug);
  if (!medicine) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  return NextResponse.json({ data: medicine });
}

/**
 * PATCH /api/medicines/:slugOrId — admin edits a medicine (send the full record). A rejected one is sent for review again; a live one whose generic, ingredients, strength, form or Rx changed goes back to review.
 * A pharmacist can only fix their own rejected proposal and send it again.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/medicines/[slug]">) {
  const { user, res } = await guard("admin", "pharmacist");
  if (res) return res;
  const { slug } = await ctx.params;
  const existing = findMedicine(slug);
  if (!existing) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  const input = cleanMedicine(await readJson(req));
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 });
  if (user.role === "admin") return NextResponse.json({ data: updateMedicine(existing.id, input.value) });
  const result = resubmitMedicine(user, existing.id, input.value);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value });
}

/** DELETE /api/medicines/:slugOrId — admin removes a medicine and all pharmacy listings of it. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/medicines/[slug]">) {
  const { res } = await guard("admin");
  if (res) return res;
  const { slug } = await ctx.params;
  const existing = findMedicine(slug);
  if (!existing) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  deleteMedicine(existing.id);
  return NextResponse.json({ data: null });
}
