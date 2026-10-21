import type { Prescription } from "@/lib/types";
import { dayOffset } from "./dates";

export const prescriptions: Prescription[] = [
  {
    id: "rx-1001", doctorId: "u-doc1", patientId: "u-pat1", issuedAt: dayOffset(-10), validUntil: dayOffset(20), appointmentId: "ap-4",
    diagnosis: "Hypertension, high cholesterol",
    items: [
      { medicineId: "m04", dose: "1 tablet once daily", days: 60 },
      { medicineId: "m08", dose: "1 tablet at night", days: 60 },
    ],
  },
  {
    id: "rx-1002", doctorId: "u-doc1", patientId: "u-pat1", issuedAt: dayOffset(-50), validUntil: dayOffset(-20),
    diagnosis: "Respiratory tract infection",
    items: [{ medicineId: "m06", dose: "1 tablet once daily", days: 5 }],
  },
  {
    id: "rx-1003", doctorId: "u-doc1", patientId: "u-pat2", issuedAt: dayOffset(-8), validUntil: dayOffset(22),
    diagnosis: "Epilepsy (maintenance)",
    items: [{ medicineId: "m13", dose: "1 tablet twice daily", days: 90 }],
  },
  {
    id: "rx-1004", doctorId: "u-doc1", patientId: "u-pat3", issuedAt: dayOffset(-3), validUntil: dayOffset(27),
    diagnosis: "Type 2 diabetes",
    items: [
      { medicineId: "m05", dose: "1 tablet after breakfast and dinner", days: 30 },
      { medicineId: "m04", dose: "1 tablet once daily", days: 30 },
    ],
  },
  {
    id: "rx-1005", doctorId: "", patientId: "u-pat3", issuedAt: dayOffset(-5), validUntil: dayOffset(25),
    diagnosis: "Seasonal allergy", uploaded: true, fileName: "prescription-photo.jpg", doctorName: "Dr. A. Rahman",
    items: [{ medicineId: "m07", dose: "1 tablet at night", days: 10 }],
  },
];
