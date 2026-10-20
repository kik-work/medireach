import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getDashboardData } from "@/lib/services/dashboard.service";

/** GET /api/dashboard — the data the signed-in user's dashboard needs (filtered by role). */
export async function GET() {
  const { user, res } = await guard();
  if (res) return res;
  return NextResponse.json({ data: getDashboardData(user) }, { headers: { "Cache-Control": "no-store" } });
}
