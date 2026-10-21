import { addDays, today } from "@/lib/rules";
import type { Appointment, AppointmentStatus, BusySlot, ChatMessage, ConsultMode, DoctorProfile, MedicalReport, Prescription } from "@/lib/types";

/** Consultation rules shared by the server and the dashboards. */
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Saturday to Thursday (Friday is the weekly off day). */
export const DEFAULT_DAYS = [6, 0, 1, 2, 3, 4];
export const DEFAULT_TIMES = ["10:00", "10:30", "11:00", "11:30", "17:00", "17:30", "18:00"];
/** Patients can book from today up to this many days ahead. */
export const BOOKING_DAYS = 14;

/** A slot is taken while the appointment is still open. */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["requested", "approved", "rescheduled"];
export const isActive = (a: Pick<Appointment, "status">) => ACTIVE_STATUSES.includes(a.status);
/** Chat and video are open for approved visits. */
export const isLive = (a: Pick<Appointment, "status">) => a.status === "approved" || a.status === "rescheduled";

export const MODE_LABEL: Record<ConsultMode, string> = { video: "Video call", chat: "Chat" };

export const weekday = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).getUTCDay();

/** "Tue 21 Oct" */
export const formatDay = (isoDate: string) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}`;
};

export const bookableDates = (count = BOOKING_DAYS) => Array.from({ length: count }, (_, i) => addDays(today(), i));

/** Free start times of a doctor on one date. Empty on a day off or a date outside the booking window. */
export function freeSlots(profile: DoctorProfile, date: string, busy: BusySlot[]): string[] {
  if (date < today() || date > addDays(today(), BOOKING_DAYS - 1)) return [];
  if (!profile.days.includes(weekday(date))) return [];
  const taken = new Set(busy.filter((b) => b.doctorId === profile.doctorId && b.date === date).map((b) => b.time));
  return profile.times.filter((t) => !taken.has(t));
}

/** First free slot in the booking window, or null when the doctor is fully booked. */
export function nextSlot(profile: DoctorProfile, busy: BusySlot[]) {
  if (!profile.accepting) return null;
  for (const date of bookableDates()) {
    const [time] = freeSlots(profile, date, busy);
    if (time) return { date, time };
  }
  return null;
}

/** Everything the consultation room shows, as sent by GET /api/appointments/:id. */
export interface RoomData {
  appointment: Appointment;
  messages: ChatMessage[];
  reports: MedicalReport[];
  prescriptions: Prescription[];
  /** true once the patient ordered a medicine from the linked prescription. */
  ordered: boolean;
}
