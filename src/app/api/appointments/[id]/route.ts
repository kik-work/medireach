import { NextResponse } from "next/server";
import { readJson } from "@/lib/auth";
import { guardAppointment } from "@/lib/appointment-guard";
import { act, getRoom, type AppointmentAction } from "@/lib/services/appointment.service";

/** GET /api/appointments/:id — the consultation room: appointment, chat, reports, linked prescriptions. Polled by the room. */
export async function GET(_req: Request, ctx: RouteContext<"/api/appointments/[id]">) {
  const g = await guardAppointment((await ctx.params).id, "patient", "doctor");
  if (g.res) return g.res;
  return NextResponse.json({ data: getRoom(g.appointment) }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * PATCH /api/appointments/:id { action, note?, date?, time? }
 * doctor: approve | decline | reschedule | complete. patient: cancel. both: start-call | end-call.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/appointments/[id]">) {
  const g = await guardAppointment((await ctx.params).id, "patient", "doctor");
  if (g.res) return g.res;
  const result = act(g.appointment, g.user, await readJson<AppointmentAction>(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: getRoom(result.value) });
}
