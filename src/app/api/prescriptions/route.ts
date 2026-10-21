import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { db } from "@/lib/data";
import { getAppointment } from "@/lib/services/appointment.service";
import { cleanItems, createPrescription, listForDoctor, listForPatient } from "@/lib/services/prescription.service";

/** GET /api/prescriptions — prescriptions of the signed-in patient (issued + uploaded) or doctor (issued). */
export async function GET() {
  const { user, res } = await guard("patient", "doctor");
  if (res) return res;
  const data = user.role === "doctor" ? listForDoctor(user.id) : listForPatient(user.id);
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}

interface Body {
  patientId?: string;
  diagnosis?: string;
  items?: unknown;
  issuedAt?: string;
  fileName?: string;
  doctorName?: string;
  appointmentId?: string;
}

/**
 * POST /api/prescriptions
 * - doctor (verified): issues a prescription to a verified patient
 * - patient: saves an uploaded copy of a paper prescription for themselves
 */
export async function POST(req: Request) {
  const { user, res } = await guard("patient", "doctor");
  if (res) return res;
  const body = await readJson<Body>(req);
  const items = cleanItems(body.items);
  if (items.length === 0) return NextResponse.json({ error: "Add at least one medicine." }, { status: 422 });

  if (user.role === "doctor") {
    if (user.status !== "verified") return NextResponse.json({ error: "Your registration must be verified before you can issue prescriptions." }, { status: 403 });
    const patient = db.users.find((u) => u.id === body.patientId && u.role === "patient" && u.status === "verified");
    if (!patient) return NextResponse.json({ error: "Choose a registered patient." }, { status: 422 });
    // Optional link to the consultation this prescription was written in.
    const appointment = body.appointmentId ? getAppointment(body.appointmentId) : undefined;
    if (body.appointmentId && (appointment?.doctorId !== user.id || appointment.patientId !== patient.id)) {
      return NextResponse.json({ error: "That appointment does not match this doctor and patient." }, { status: 422 });
    }
    const rx = createPrescription({ doctorId: user.id, patientId: patient.id, diagnosis: String(body.diagnosis ?? ""), items, appointmentId: appointment?.id });
    return NextResponse.json({ data: rx }, { status: 201 });
  }

  if (!body.fileName) return NextResponse.json({ error: "Attach a photo or PDF of the prescription." }, { status: 422 });
  const rx = createPrescription({
    doctorId: "",
    patientId: user.id,
    diagnosis: String(body.diagnosis ?? ""),
    items,
    issuedAt: body.issuedAt,
    uploaded: true,
    fileName: String(body.fileName),
    doctorName: body.doctorName,
  });
  return NextResponse.json({ data: rx }, { status: 201 });
}
