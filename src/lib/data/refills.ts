import type { Refill } from "@/lib/types";
import { dayOffset } from "./dates";

export const refills: Refill[] = [
  { id: "rf-1", patientId: "u-pat1", medicineId: "m04", pharmacyId: "ph3", quantity: 2, everyDays: 30, nextDate: dayOffset(9), active: true },
  { id: "rf-2", patientId: "u-pat2", medicineId: "m13", pharmacyId: "ph3", quantity: 3, everyDays: 30, nextDate: dayOffset(14), active: true },
];
