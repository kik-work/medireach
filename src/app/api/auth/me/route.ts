import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { toSession } from "@/lib/session";

/** GET /api/auth/me — the signed-in user, or { data: null }. */
export async function GET() {
  const user = await getSession();
  return NextResponse.json({ data: user ? toSession(user) : null }, { headers: { "Cache-Control": "no-store" } });
}
