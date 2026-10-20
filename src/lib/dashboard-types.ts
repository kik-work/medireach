import type { Medicine, Order, Pharmacy, Prescription, Refill, Role, StockItem, VerificationStatus } from "@/lib/types";

/** A person as the dashboards see them. `identifier` (email/phone) is only sent to admins. */
export interface DashUser {
  id: string;
  name: string;
  identifier: string;
  role: Role;
  status: VerificationStatus;
  registrationNo?: string;
  city?: string;
  pharmacyId?: string;
}

/** Everything one role's dashboards need, already filtered on the server for that user. */
export interface DashboardData {
  me: DashUser;
  medicines: Medicine[];
  pharmacies: Pharmacy[];
  stock: StockItem[];
  users: DashUser[];
  prescriptions: Prescription[];
  orders: Order[];
  refills: Refill[];
  interactionCount: number;
}
