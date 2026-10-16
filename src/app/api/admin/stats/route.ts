import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/services/admin.service";

/** GET /api/admin/stats — localhost only (enforced in src/proxy.ts). */
export function GET() {
  return NextResponse.json({ data: getPlatformStats() });
}
