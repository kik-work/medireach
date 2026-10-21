import { NextResponse } from "next/server";
import { guardAppointment } from "@/lib/appointment-guard";
import { deleteReport } from "@/lib/services/appointment.service";

/** DELETE /api/appointments/:id/reports/:reportId — the patient removes a report. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/appointments/[id]/reports/[reportId]">) {
  const { id, reportId } = await ctx.params;
  const g = await guardAppointment(id, "patient");
  if (g.res) return g.res;
  if (!deleteReport(id, reportId)) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ data: null });
}
