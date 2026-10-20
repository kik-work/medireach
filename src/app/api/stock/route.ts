import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { getMedicineById } from "@/lib/services/medicine.service";
import { getInventory, updateStock } from "@/lib/services/pharmacy.service";

/** GET /api/stock — the pharmacist's own inventory. */
export async function GET() {
  const { user, res } = await guard("pharmacist");
  if (res) return res;
  return NextResponse.json({ data: getInventory(user.pharmacyId ?? "-") }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/stock { medicineId, quantity, price } — add or update a listing (upsert) in the pharmacist's pharmacy. */
export async function POST(req: Request) {
  const { user, res } = await guard("pharmacist");
  if (res) return res;
  if (!user.pharmacyId) return NextResponse.json({ error: "No pharmacy is linked to your account." }, { status: 422 });
  const body = await readJson<{ medicineId?: string; quantity?: number; price?: number }>(req);
  if (!body.medicineId || !getMedicineById(body.medicineId)) return NextResponse.json({ error: "Choose a medicine." }, { status: 422 });
  const quantity = Math.floor(Number(body.quantity));
  const price = Number(body.price);
  if (!(quantity >= 0) || !(price >= 0)) return NextResponse.json({ error: "Quantity and price must be 0 or more." }, { status: 422 });

  updateStock(user.pharmacyId, body.medicineId, quantity, price);
  return NextResponse.json({ data: { pharmacyId: user.pharmacyId, medicineId: body.medicineId, quantity, price } });
}
