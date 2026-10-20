import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getPharmacy, removeStock } from "@/lib/services/pharmacy.service";

/**
 * DELETE /api/stock/:medicineId
 * pharmacist: removes the listing from their pharmacy.
 * admin: moderation — removes it from the pharmacy given as ?pharmacyId=.
 */
export async function DELETE(req: Request, ctx: RouteContext<"/api/stock/[medicineId]">) {
  const { user, res } = await guard("pharmacist", "admin");
  if (res) return res;
  const { medicineId } = await ctx.params;
  const pharmacyId = user.role === "admin" ? new URL(req.url).searchParams.get("pharmacyId") : user.pharmacyId;
  if (!pharmacyId || !getPharmacy(pharmacyId)) return NextResponse.json({ error: "Pharmacy not found." }, { status: 404 });
  if (!removeStock(pharmacyId, medicineId)) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  return NextResponse.json({ data: null });
}
