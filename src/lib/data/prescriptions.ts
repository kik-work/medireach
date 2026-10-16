import type { Prescription } from "@/lib/types";

export const prescriptions: Prescription[] = [
  {
    id: "rx-1001", doctorId: "u-doc1", patientId: "u-pat1", issuedAt: "2026-10-10", validUntil: "2026-12-10",
    diagnosis: "Hypertension, high cholesterol",
    items: [
      { medicineId: "m04", dose: "1 tablet once daily", days: 60 },
      { medicineId: "m08", dose: "1 tablet at night", days: 60 },
    ],
  },
  {
    id: "rx-1002", doctorId: "u-doc1", patientId: "u-pat1", issuedAt: "2026-09-02", validUntil: "2026-10-02",
    diagnosis: "Respiratory tract infection",
    items: [{ medicineId: "m06", dose: "1 tablet once daily", days: 5 }],
  },
  {
    id: "rx-1003", doctorId: "u-doc1", patientId: "u-pat2", issuedAt: "2026-10-12", validUntil: "2027-01-12",
    diagnosis: "Epilepsy (maintenance)",
    items: [{ medicineId: "m13", dose: "1 tablet twice daily", days: 90 }],
  },
];
