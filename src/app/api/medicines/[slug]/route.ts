import { NextResponse, type NextRequest } from "next/server";
import { getMedicineBySlug } from "@/lib/services/medicine.service";

/** GET /api/medicines/:slug */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/medicines/[slug]">) {
  const { slug } = await ctx.params;
  const medicine = getMedicineBySlug(slug);
  if (!medicine) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  return NextResponse.json({ data: medicine });
}
