import type { Appointment } from "@/lib/types";
import { dayOffset } from "./dates";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const appointments: Appointment[] = [
  { id: "ap-1", patientId: "u-pat1", doctorId: "u-doc1", date: dayOffset(1), time: "10:00", mode: "video", reason: "Follow-up for blood pressure and cholesterol", status: "approved", createdAt: ago(300), doctorNote: "Please keep your BP readings for the last week ready." },
  { id: "ap-2", patientId: "u-pat2", doctorId: "u-doc1", date: dayOffset(1), time: "10:30", mode: "chat", reason: "Review of my seizure medicine dose", status: "requested", createdAt: ago(90) },
  { id: "ap-3", patientId: "u-pat3", doctorId: "u-doc1", date: dayOffset(2), time: "11:00", mode: "video", reason: "Diabetes check, sugar levels are rising", status: "requested", createdAt: ago(40) },
  { id: "ap-4", patientId: "u-pat1", doctorId: "u-doc1", date: dayOffset(-10), time: "10:30", mode: "chat", reason: "High blood pressure", status: "completed", createdAt: ago(60 * 24 * 12) },
  { id: "ap-5", patientId: "u-pat1", doctorId: "u-doc4", date: dayOffset(3), time: "09:30", mode: "video", reason: "Occasional chest tightness while climbing stairs", status: "declined", createdAt: ago(200), doctorNote: "I am on leave that week. Please book another cardiologist." },
];
