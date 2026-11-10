import { NextResponse } from "next/server";
import { guardAppointment } from "@/lib/appointment-guard";
import { deleteReport, listReports } from "@/lib/services/appointment.service";
import { readUpload } from "@/lib/uploads";

/** GET /api/appointments/:id/reports/:reportId — the stored file. Only the patient and the doctor of the appointment. */
export async function GET(_req: Request, ctx: RouteContext<"/api/appointments/[id]/reports/[reportId]">) {
  const { id, reportId } = await ctx.params;
  const g = await guardAppointment(id, "patient", "doctor");
  if (g.res) return g.res;
  const report = listReports(id).find((r) => r.id === reportId);
  const bytes = report?.fileType ? readUpload(report.id) : null;
  if (!report || !bytes) return NextResponse.json({ error: "No file is stored for this report." }, { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": report.fileType!,
      "Content-Disposition": `inline; filename="${report.fileName.replace(/["\r\n]/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** DELETE /api/appointments/:id/reports/:reportId — the patient removes a report and its file. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/appointments/[id]/reports/[reportId]">) {
  const { id, reportId } = await ctx.params;
  const g = await guardAppointment(id, "patient");
  if (g.res) return g.res;
  if (!deleteReport(id, reportId)) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ data: null });
}
