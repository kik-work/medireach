import { NextResponse } from "next/server";
import { readJson } from "@/lib/auth";
import { guardAppointment } from "@/lib/appointment-guard";
import { addReport } from "@/lib/services/appointment.service";

/** POST /api/appointments/:id/reports { fileName, note? } — the patient attaches a test report (file name only; the file is not stored). */
export async function POST(req: Request, ctx: RouteContext<"/api/appointments/[id]/reports">) {
  const g = await guardAppointment((await ctx.params).id, "patient");
  if (g.res) return g.res;
  const result = addReport(g.appointment, await readJson<{ fileName?: string; note?: string }>(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value }, { status: 201 });
}
