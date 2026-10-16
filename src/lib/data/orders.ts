import type { Order } from "@/lib/types";

export const orders: Order[] = [
  { id: "ORD-2001", patientId: "u-pat1", pharmacyId: "ph1", lines: [{ medicineId: "m01", quantity: 2, unitPrice: 12 }], total: 24, status: "delivered", createdAt: "2026-10-05" },
  { id: "ORD-2002", patientId: "u-pat1", pharmacyId: "ph3", lines: [{ medicineId: "m04", quantity: 2, unitPrice: 5 }, { medicineId: "m08", quantity: 2, unitPrice: 14 }], total: 38, status: "packed", createdAt: "2026-10-14" },
  { id: "ORD-2003", patientId: "u-pat2", pharmacyId: "ph3", lines: [{ medicineId: "m13", quantity: 3, unitPrice: 28 }], total: 84, status: "pre-order", createdAt: "2026-10-15" },
  { id: "ORD-2004", patientId: "u-pat1", pharmacyId: "ph3", lines: [{ medicineId: "m03", quantity: 1, unitPrice: 6 }], total: 6, status: "placed", createdAt: "2026-10-16" },
];
