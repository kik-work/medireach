import { NextResponse, type NextRequest } from "next/server";
import { buildCautionReport } from "@/lib/services/caution.service";

/** POST /api/caution  { medicineIds: string[] } → AI caution report (retrieval-based). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { medicineIds?: unknown } | null;
  if (!body || !Array.isArray(body.medicineIds) || !body.medicineIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "medicineIds must be a string array" }, { status: 400 });
  }
  return NextResponse.json({ data: buildCautionReport(body.medicineIds as string[]) });
}
