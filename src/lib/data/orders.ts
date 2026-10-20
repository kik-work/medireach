import type { Order } from "@/lib/types";
import { dayOffset } from "./dates";

export const orders: Order[] = [
  { id: "ORD-2001", patientId: "u-pat1", pharmacyId: "ph1", lines: [{ medicineId: "m01", quantity: 2, unitPrice: 12 }], total: 24, status: "delivered", createdAt: dayOffset(-15) },
  { id: "ORD-2002", patientId: "u-pat1", pharmacyId: "ph3", lines: [{ medicineId: "m04", quantity: 2, unitPrice: 5 }, { medicineId: "m08", quantity: 2, unitPrice: 14 }], total: 38, status: "packed", createdAt: dayOffset(-6) },
  { id: "ORD-2003", patientId: "u-pat2", pharmacyId: "ph3", lines: [{ medicineId: "m13", quantity: 3, unitPrice: 28 }], total: 84, status: "pre-order", createdAt: dayOffset(-5) },
  { id: "ORD-2004", patientId: "u-pat1", pharmacyId: "ph3", lines: [{ medicineId: "m03", quantity: 1, unitPrice: 6 }], total: 6, status: "placed", createdAt: dayOffset(-4) },
  { id: "ORD-2005", patientId: "u-pat3", pharmacyId: "ph4", lines: [{ medicineId: "m05", quantity: 2, unitPrice: 4 }], total: 8, status: "confirmed", createdAt: dayOffset(-2) },
  { id: "ORD-2006", patientId: "u-pat3", pharmacyId: "ph3", lines: [{ medicineId: "m07", quantity: 1, unitPrice: 3 }], total: 3, status: "cancelled", createdAt: dayOffset(-9) },
];
