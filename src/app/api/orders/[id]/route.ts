import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { changeOrderStatus } from "@/lib/services/order.service";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "packed", "delivered", "cancelled", "pre-order"];

/**
 * PATCH /api/orders/:id { status }
 * pharmacist: next fulfilment step or cancel · patient: cancel own early order · admin: cancel.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { user, res } = await guard();
  if (res) return res;
  const { status } = await readJson<{ status?: OrderStatus }>(req);
  if (!status || !STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const result = changeOrderStatus((await ctx.params).id, status, user);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.code });
  return NextResponse.json({ data: result.order });
}
