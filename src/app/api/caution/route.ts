import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { buildCautionReport } from "@/lib/services/caution.service";

/**
 * POST /api/caution  { medicineIds: string[] } → AI caution report (retrieval-based).
 * For a signed-in patient, the medicines on their profile (valid prescriptions, active refills,
 * orders of the last 30 days) are checked too.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { medicineIds?: unknown } | null;
  if (!body || !Array.isArray(body.medicineIds) || !body.medicineIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "medicineIds must be a string array" }, { status: 400 });
  }
  const user = await getSession();
  const patientId = user?.role === "patient" ? user.id : undefined;
  return NextResponse.json(
    { data: buildCautionReport(body.medicineIds as string[], { patientId }) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
