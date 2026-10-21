import type { MedicalReport } from "@/lib/types";
import { dayOffset } from "./dates";

export const reports: MedicalReport[] = [
  { id: "rep-1", appointmentId: "ap-4", patientId: "u-pat1", fileName: "lipid-profile.pdf", note: "Done last Sunday", uploadedAt: dayOffset(-10) },
  { id: "rep-2", appointmentId: "ap-4", patientId: "u-pat1", fileName: "bp-log-week.jpg", uploadedAt: dayOffset(-10) },
];
