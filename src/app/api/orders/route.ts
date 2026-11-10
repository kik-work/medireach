import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { listOrders, placeOrder, type CartLineInput } from "@/lib/services/order.service";
import type { PaymentInput } from "@/lib/services/payment.service";

/** GET /api/orders — orders of the signed-in patient, or of the pharmacist's pharmacy. */
export async function GET() {
  const { user, res } = await guard("patient", "pharmacist");
  if (res) return res;
  const data = user.role === "patient" ? listOrders({ patientId: user.id }) : listOrders({ pharmacyId: user.pharmacyId ?? "-" });
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/orders { lines: [{ medicineId, pharmacyId, quantity }], payment?: { method: "cod" | "bkash" | "card", account?, expiry? } } — checkout (patient).
 * Payment is simulated: bKash and card are "charged" at once, cash on delivery is collected when the order is delivered.
 * Rx-only medicines need a valid prescription (422). Lines the pharmacy cannot cover become a pre-order.
 */
export async function POST(req: Request) {
  const { user, res } = await guard("patient");
  if (res) return res;
  if (user.status !== "verified") return NextResponse.json({ ok: false, error: "Your account is suspended." }, { status: 403 });
  const body = await readJson<{ lines?: CartLineInput[]; payment?: PaymentInput }>(req);
  if (!Array.isArray(body.lines) || body.lines.length === 0) return NextResponse.json({ ok: false, error: "No order lines." }, { status: 400 });

  const result = placeOrder(user.id, body.lines, { payment: body.payment });
  return NextResponse.json(result, { status: result.ok ? 201 : 422 });
}
