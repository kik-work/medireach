import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getAppointment, isParticipant } from "@/lib/services/appointment.service";
import type { Appointment, Role, User } from "@/lib/types";

/** Route guard for one appointment: signed in, an allowed role, and a participant of that appointment. */
export async function guardAppointment(id: string, ...roles: Role[]): Promise<{ user: User; appointment: Appointment; res?: undefined } | { res: Response }> {
  const { user, res } = await guard(...roles);
  if (res) return { res };
  const appointment = getAppointment(id);
  if (!appointment) return { res: NextResponse.json({ error: "Appointment not found." }, { status: 404 }) };
  if (!isParticipant(appointment, user.id)) return { res: NextResponse.json({ error: "Not your appointment." }, { status: 403 }) };
  return { user, appointment };
}
