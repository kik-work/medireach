import { db } from "@/lib/data";
import type { Medicine, Order, Pharmacy, Prescription, StockItem, User } from "@/lib/types";

/** Reference + starter data the dashboards start from. Mutations live in the browser (see dashboard-store). */
export interface DashboardSeed {
  medicines: Medicine[];
  pharmacies: Pharmacy[];
  stock: StockItem[];
  users: User[];
  prescriptions: Prescription[];
  orders: Order[];
}

export const getDashboardSeed = (): DashboardSeed => ({
  medicines: db.medicines,
  pharmacies: db.pharmacies,
  stock: db.stock,
  users: db.users.filter((u) => u.role !== "admin"),
  prescriptions: db.prescriptions,
  orders: db.orders,
});
