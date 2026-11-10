import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { allow, clientKey } from "@/lib/rate-limit";
import { buildCautionReport } from "@/lib/services/caution.service";
import { phraseCautionReport, phrasingEnabled } from "@/lib/services/caution-phrasing.service";

const MAX_IDS = 20;

/**
 * POST /api/caution/summary { medicineIds: string[], withProfile?: boolean } → { data: { text, model } | null }
 * Plain-language phrasing of the same retrieval-based report. null when phrasing is off
 * (no ANTHROPIC_API_KEY) or the model call failed; the caution cards stay the source of truth.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { medicineIds?: unknown; withProfile?: unknown } | null;
  if (!body || !Array.isArray(body.medicineIds) || !body.medicineIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "medicineIds must be a string array" }, { status: 400 });
  }
  if (!phrasingEnabled()) return NextResponse.json({ data: null });
  const ids = [...new Set(body.medicineIds as string[])].slice(0, MAX_IDS);
  const user = await getSession();
  // Each phrasing is a paid model call: 20 per minute per user or address.
  if (!allow(`caution:${clientKey(req, user?.id)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  // Same scope as the cards on screen: the profile is included only when the page included it.
  const patientId = body.withProfile === true && user?.role === "patient" ? user.id : undefined;
  const report = buildCautionReport(ids, { patientId });
  return NextResponse.json({ data: await phraseCautionReport(report) }, { headers: { "Cache-Control": "private, no-store" } });
}
