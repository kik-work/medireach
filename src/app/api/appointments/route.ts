import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { bookAppointment, listForUser, type BookInput } from "@/lib/services/appointment.service";

/** GET /api/appointments — the signed-in patient's or doctor's appointments. */
export async function GET() {
  const { user, res } = await guard("patient", "doctor");
  if (res) return res;
  return NextResponse.json({ data: listForUser(user) }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/appointments { doctorId, date, time, mode, reason } — a patient asks a doctor for an appointment. */
export async function POST(req: Request) {
  const { user, res } = await guard("patient");
  if (res) return res;
  const result = bookAppointment(user.id, await readJson<BookInput>(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value }, { status: 201 });
}
