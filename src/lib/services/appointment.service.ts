import { db, nextId, save } from "@/lib/data";
import { freeSlots, isActive, isLive, type RoomData } from "@/lib/consult";
import { today } from "@/lib/rules";
import type { Appointment, BusySlot, ChatMessage, ConsultMode, MedicalReport, User } from "@/lib/types";
import { getProfile, listPublicProfiles } from "./doctor.service";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string; status: number };
const fail = (error: string, status = 422): { ok: false; error: string; status: number } => ({ ok: false, error, status });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REPORTS = 10;

export const getAppointment = (id: string) => db.appointments.find((a) => a.id === id);

export const isParticipant = (a: Appointment, userId: string) => a.patientId === userId || a.doctorId === userId;

export const listForUser = (user: User) =>
  db.appointments
    .filter((a) => (user.role === "doctor" ? a.doctorId === user.id : a.patientId === user.id))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

/** Taken slots. `ignoreId` leaves one appointment out (used when it is being moved). */
export const busySlots = (doctorId?: string, ignoreId?: string): BusySlot[] =>
  db.appointments
    .filter((a) => isActive(a) && a.id !== ignoreId && (!doctorId || a.doctorId === doctorId))
    .map(({ doctorId, date, time }) => ({ doctorId, date, time }));

/** Checks that a doctor works at `date` `time` and the slot is free. */
function checkSlot(doctorId: string, date: string, time: string, ignoreId?: string): string | null {
  const profile = getProfile(doctorId);
  if (!profile) return "This doctor has no schedule yet.";
  if (!DATE_RE.test(date)) return "Choose a date.";
  if (!freeSlots(profile, date, busySlots(doctorId, ignoreId)).includes(time)) return "That time is not available. Pick another slot.";
  return null;
}

export interface BookInput { doctorId?: string; date?: string; time?: string; mode?: string; reason?: string }

export function bookAppointment(patientId: string, input: BookInput): Result<Appointment> {
  const doctor = listPublicProfiles().find((p) => p.doctorId === input.doctorId);
  if (!doctor) return fail("Choose a verified doctor.");
  if (!doctor.accepting) return fail(`This doctor is not taking appointments right now. Choose another ${doctor.specialty} doctor.`);
  const date = input.date ?? "";
  const time = input.time ?? "";
  const reason = (input.reason ?? "").trim().slice(0, 500);
  if (!reason) return fail("Tell the doctor why you want to consult.");
  const slotError = checkSlot(doctor.doctorId, date, time);
  if (slotError) return fail(slotError, 409);
  if (db.appointments.some((a) => a.patientId === patientId && isActive(a) && a.date === date && a.time === time)) {
    return fail("You already have an appointment at that time.", 409);
  }

  const appointment: Appointment = {
    id: nextId("ap-", db.appointments.map((a) => a.id)),
    patientId,
    doctorId: doctor.doctorId,
    date,
    time,
    mode: (input.mode === "chat" ? "chat" : "video") as ConsultMode,
    reason,
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  db.appointments.push(appointment);
  save();
  return { ok: true, value: appointment };
}

export type AppointmentAction =
  | { action: "approve" | "decline"; note?: string }
  | { action: "complete" | "cancel" | "start-call" | "end-call" }
  | { action: "reschedule"; date?: string; time?: string; note?: string };

/** One entry point for every status change. The rules for each role live here. */
export function act(a: Appointment, user: User, body: AppointmentAction): Result<Appointment> {
  const isDoctor = user.role === "doctor" && a.doctorId === user.id;
  const isPatient = user.role === "patient" && a.patientId === user.id;
  const note = "note" in body ? body.note?.trim().slice(0, 300) || undefined : undefined;

  switch (body.action) {
    case "approve":
    case "decline":
      if (!isDoctor) return fail("Only the doctor can do this.", 403);
      if (user.status !== "verified") return fail("Your registration must be verified first.", 403);
      if (a.status !== "requested") return fail("This request was already answered.", 409);
      a.status = body.action === "approve" ? "approved" : "declined";
      a.doctorNote = note ?? (body.action === "decline" ? "The doctor cannot take this appointment. Please book another doctor." : undefined);
      break;

    case "reschedule": {
      if (!isDoctor) return fail("Only the doctor can do this.", 403);
      if (user.status !== "verified") return fail("Your registration must be verified first.", 403);
      if (!isActive(a)) return fail("This appointment is closed.", 409);
      const slotError = checkSlot(a.doctorId, body.date ?? "", body.time ?? "", a.id);
      if (slotError) return fail(slotError, 409);
      a.previous = { date: a.date, time: a.time };
      a.date = body.date!;
      a.time = body.time!;
      a.status = "rescheduled";
      a.doctorNote = note;
      break;
    }

    case "complete":
      if (!isDoctor) return fail("Only the doctor can do this.", 403);
      if (!isLive(a)) return fail("Only an approved appointment can be completed.", 409);
      a.status = "completed";
      a.callActive = false;
      break;

    case "cancel":
      if (!isPatient) return fail("Only the patient can cancel.", 403);
      if (!isActive(a)) return fail("This appointment is already closed.", 409);
      a.status = "cancelled";
      a.callActive = false;
      break;

    case "start-call":
    case "end-call":
      if (!isParticipant(a, user.id)) return fail("Not your appointment.", 403);
      if (!isLive(a)) return fail("The call opens after the doctor approves the appointment.", 409);
      a.callActive = body.action === "start-call";
      break;

    default:
      return fail("Unknown action.");
  }
  save();
  return { ok: true, value: a };
}

export const listMessages = (appointmentId: string) => db.messages.filter((m) => m.appointmentId === appointmentId);

export function addMessage(a: Appointment, senderId: string, rawText: string): Result<ChatMessage> {
  const text = rawText.trim().slice(0, 1000);
  if (!text) return fail("Type a message.");
  if (!isLive(a)) return fail("Chat is open while the appointment is approved.", 409);
  const message: ChatMessage = {
    id: nextId("msg-", db.messages.map((m) => m.id)),
    appointmentId: a.id,
    senderId,
    text,
    createdAt: new Date().toISOString(),
  };
  db.messages.push(message);
  save();
  return { ok: true, value: message };
}

export const listReports = (appointmentId: string) => db.reports.filter((r) => r.appointmentId === appointmentId);

export function addReport(a: Appointment, input: { fileName?: string; note?: string }): Result<MedicalReport> {
  const fileName = (input.fileName ?? "").trim().slice(0, 120);
  if (!fileName) return fail("Attach a file.");
  if (a.status === "declined" || a.status === "cancelled") return fail("This appointment is closed.", 409);
  if (listReports(a.id).length >= MAX_REPORTS) return fail(`You can attach up to ${MAX_REPORTS} reports.`);
  const report: MedicalReport = {
    id: nextId("rep-", db.reports.map((r) => r.id)),
    appointmentId: a.id,
    patientId: a.patientId,
    fileName,
    note: input.note?.trim().slice(0, 200) || undefined,
    uploadedAt: today(),
  };
  db.reports.push(report);
  save();
  return { ok: true, value: report };
}

export function deleteReport(appointmentId: string, reportId: string) {
  const before = db.reports.length;
  db.reports = db.reports.filter((r) => !(r.id === reportId && r.appointmentId === appointmentId));
  save();
  return db.reports.length < before;
}

/** Everything the consultation room shows. `ordered` = the patient ordered a medicine from a linked prescription after it was issued. */
export function getRoom(a: Appointment): RoomData {
  const prescriptions = db.prescriptions.filter((r) => r.appointmentId === a.id);
  return {
    appointment: a,
    messages: listMessages(a.id),
    reports: listReports(a.id),
    prescriptions,
    ordered: prescriptions.some((rx) =>
      db.orders.some((o) => o.patientId === a.patientId && o.status !== "cancelled" && o.createdAt >= rx.issuedAt && o.lines.some((l) => rx.items.some((i) => i.medicineId === l.medicineId))),
    ),
  };
}
