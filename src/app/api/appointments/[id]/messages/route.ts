import { NextResponse } from "next/server";
import { readJson } from "@/lib/auth";
import { guardAppointment } from "@/lib/appointment-guard";
import { addMessage } from "@/lib/services/appointment.service";

/** POST /api/appointments/:id/messages { text } — send a chat message (while the appointment is approved). */
export async function POST(req: Request, ctx: RouteContext<"/api/appointments/[id]/messages">) {
  const g = await guardAppointment((await ctx.params).id, "patient", "doctor");
  if (g.res) return g.res;
  const { text } = await readJson<{ text?: unknown }>(req);
  const result = addMessage(g.appointment, g.user.id, typeof text === "string" ? text : "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value }, { status: 201 });
}
