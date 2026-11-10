import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { db } from "@/lib/data";
import { getAppointment } from "@/lib/services/appointment.service";
import { cleanItems, createPrescription, deletePrescription, listForDoctor, listForPatient } from "@/lib/services/prescription.service";
import { parseDataUrl, writeUpload } from "@/lib/uploads";

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
  /** Patient upload: the photo or PDF as a data URL ("data:image/jpeg;base64,…"). */
  fileData?: string;
  doctorName?: string;
  appointmentId?: string;
}

/**
 * POST /api/prescriptions
 * - doctor (verified): issues a prescription to a verified patient
 * - patient: uploads a photo/PDF of a paper prescription. It stays "pending" and unlocks
 *   Rx medicines only after an admin approves it (POST /api/prescriptions/:id/review).
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

  if (user.status !== "verified") return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
  const file = parseDataUrl(body.fileData);
  if (!file.ok) return NextResponse.json({ error: file.error }, { status: 422 });
  const rx = createPrescription({
    doctorId: "",
    patientId: user.id,
    diagnosis: String(body.diagnosis ?? ""),
    items,
    issuedAt: body.issuedAt,
    uploaded: true,
    fileName: String(body.fileName ?? "prescription").replace(/[^\w .()-]/g, "_").slice(0, 120),
    fileType: file.type,
    doctorName: typeof body.doctorName === "string" ? body.doctorName.slice(0, 120) : undefined,
  });
  if (!writeUpload(rx.id, file.bytes)) {
    deletePrescription(rx.id);
    return NextResponse.json({ error: "The file could not be stored. Try again later." }, { status: 500 });
  }
  return NextResponse.json({ data: rx }, { status: 201 });
}
