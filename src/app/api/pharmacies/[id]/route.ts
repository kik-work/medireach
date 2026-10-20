import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { getPharmacy, setPharmacyStatus, updatePharmacy, type PharmacyInput } from "@/lib/services/pharmacy.service";
import type { City, VerificationStatus } from "@/lib/types";

const STATUSES: VerificationStatus[] = ["pending", "verified", "rejected", "suspended"];

/**
 * PATCH /api/pharmacies/:id { name?, city?, area?, address?, phone?, licenseNo?, status? }
 * pharmacist: edits the details/location of their own pharmacy · admin: edits any and sets the verification status.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/pharmacies/[id]">) {
  const { user, res } = await guard("pharmacist", "admin");
  if (res) return res;
  const pharmacy = getPharmacy((await ctx.params).id);
  if (!pharmacy) return NextResponse.json({ error: "Pharmacy not found." }, { status: 404 });
  if (user.role === "pharmacist" && user.pharmacyId !== pharmacy.id) return NextResponse.json({ error: "Not your pharmacy." }, { status: 403 });

  const body = await readJson<Partial<PharmacyInput> & { status?: VerificationStatus }>(req);
  if (body.city && !CITIES.includes(body.city as City)) return NextResponse.json({ error: "Unknown city." }, { status: 422 });
  if (body.status !== undefined) {
    if (user.role !== "admin") return NextResponse.json({ error: "Only an admin can change verification." }, { status: 403 });
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid status." }, { status: 422 });
    setPharmacyStatus(pharmacy.id, body.status);
  }
  return NextResponse.json({ data: updatePharmacy(pharmacy.id, body) });
}
