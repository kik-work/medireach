import { NextResponse, type NextRequest } from "next/server";
import { placeOrder, listOrders, type CartLineInput } from "@/lib/services/order.service";

// Accounts now live in the browser (localStorage), so the server cannot verify who is calling.
// The patient id comes from the client. Fine for dummy in-memory data; not for real orders.

/** GET /api/orders?patientId=… — orders of that patient. */
export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId) return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  return NextResponse.json({ data: listOrders({ patientId }) });
}

/** POST /api/orders { patientId, lines: [{ medicineId, pharmacyId, quantity }] } — checkout. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { patientId?: string; lines?: CartLineInput[] } | null;
  if (!body?.patientId) return NextResponse.json({ error: "Log in as a patient to place an order" }, { status: 401 });
  if (!body.lines?.length) return NextResponse.json({ error: "No order lines" }, { status: 400 });

  const result = placeOrder(body.patientId, body.lines);
  return NextResponse.json(result, { status: result.ok ? 201 : 422 });
}
