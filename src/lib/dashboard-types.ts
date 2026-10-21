import type { Appointment, BusySlot, DoctorProfile, Medicine, Order, Pharmacy, Prescription, Refill, Role, StockItem, VerificationStatus } from "@/lib/types";

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
  /** Patient: verified doctors. Doctor: own profile (empty until set up). Admin: all. */
  doctorProfiles: DoctorProfile[];
  appointments: Appointment[];
  /** Doctor: medicines waiting for their review. Pharmacist: their own proposals that are pending or rejected. */
  pendingMedicines: Medicine[];
  /** Taken slots, so booking forms hide them. */
  busy: BusySlot[];
  interactionCount: number;
}
