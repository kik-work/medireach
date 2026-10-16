import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { placeOrder, listOrders, type CartLineInput } from "@/lib/services/order.service";

/** GET /api/orders — orders of the logged-in patient. */
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  return NextResponse.json({ data: listOrders({ patientId: user.id }) });
}

/** POST /api/orders { lines: [{ medicineId, pharmacyId, quantity }] } — checkout. */
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "patient") {
    return NextResponse.json({ error: "Log in as a patient to place an order" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { lines?: CartLineInput[] } | null;
  if (!body?.lines?.length) return NextResponse.json({ error: "No order lines" }, { status: 400 });

  const result = placeOrder(user.id, body.lines);
  return NextResponse.json(result, { status: result.ok ? 201 : 422 });
}
