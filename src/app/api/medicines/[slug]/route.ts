import { NextResponse, type NextRequest } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { cleanMedicine } from "@/lib/medicine-input";
import { deleteMedicine, getMedicineById, getMedicineBySlug, updateMedicine } from "@/lib/services/medicine.service";

/** GET /api/medicines/:slug */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/medicines/[slug]">) {
  const { slug } = await ctx.params;
  const medicine = getMedicineBySlug(slug);
  if (!medicine) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  return NextResponse.json({ data: medicine });
}

/** PATCH /api/medicines/:slugOrId — admin edits a medicine (send the full record). */
export async function PATCH(req: Request, ctx: RouteContext<"/api/medicines/[slug]">) {
  const { res } = await guard("admin");
  if (res) return res;
  const { slug } = await ctx.params;
  const existing = getMedicineBySlug(slug) ?? getMedicineById(slug);
  if (!existing) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  const input = cleanMedicine(await readJson(req));
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 });
  return NextResponse.json({ data: updateMedicine(existing.id, input.value) });
}

/** DELETE /api/medicines/:slugOrId — admin removes a medicine and all pharmacy listings of it. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/medicines/[slug]">) {
  const { res } = await guard("admin");
  if (res) return res;
  const { slug } = await ctx.params;
  const existing = getMedicineBySlug(slug) ?? getMedicineById(slug);
  if (!existing) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  deleteMedicine(existing.id);
  return NextResponse.json({ data: null });
}
