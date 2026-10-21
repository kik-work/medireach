/** Domain types shared by data, services, API routes and UI. */

export type Role = "patient" | "doctor" | "pharmacist" | "admin";

export type City = "Dhaka" | "Chattogram" | "Sylhet" | "Rajshahi" | "Khulna";

export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

/** Doctor review of a medicine. A medicine goes live only when a verified doctor approves it. */
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface MedicineReview {
  status: ReviewStatus;
  /** The verified doctor who approved or rejected it. */
  reviewedBy?: string;
  reviewedAt?: string;
  /** Why it was rejected, or a note with the approval. */
  note?: string;
}

export interface Medicine {
  id: string;
  slug: string;
  brand: string;
  generic: string;
  /** Active ingredients (lowercase generic names) — used for duplicate detection. */
  ingredients: string[];
  strength: string;
  form: "Tablet" | "Capsule" | "Syrup" | "Injection";
  manufacturer: string;
  category: string;
  /** true = prescription-only (Rx). */
  rx: boolean;
  /** true = low-demand / hard-to-find medicine. */
  rare: boolean;
  /** Reference price in BDT, per unit pack. */
  price: number;
  description: string;
  uses: string[];
  cautions: string[];
  sideEffects: string[];
  /** Absent = approved (the starter catalogue). New medicines start as pending. */
  review?: MedicineReview;
  /** Id of the pharmacist who proposed it. Absent = added by an admin. */
  submittedBy?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  city: City;
  area: string;
  address: string;
  phone: string;
  rating: number;
  status: VerificationStatus;
  licenseNo: string;
}

export interface StockItem {
  pharmacyId: string;
  medicineId: string;
  quantity: number;
  price: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  city: City;
  status: VerificationStatus;
  /** BMDC no. for doctors, Pharmacy Council no. for pharmacists. */
  registrationNo?: string;
  /** Pharmacist → the pharmacy they manage. */
  pharmacyId?: string;
}

export interface PrescriptionItem {
  medicineId: string;
  dose: string;
  days: number;
}

export interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  issuedAt: string;
  validUntil: string;
  diagnosis: string;
  items: PrescriptionItem[];
  /** Patient-uploaded copy of a paper prescription (no doctorId). */
  uploaded?: boolean;
  /** Name of the file the patient attached (the file itself is not stored). */
  fileName?: string;
  /** Free-text doctor name on an uploaded prescription. */
  doctorName?: string;
  /** Consultation this prescription was written in. */
  appointmentId?: string;
}

export type OrderStatus = "placed" | "confirmed" | "packed" | "delivered" | "cancelled" | "pre-order";

export interface OrderLine {
  medicineId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  patientId: string;
  pharmacyId: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  /** true when stock was taken from the pharmacy at placement (restored on cancel). */
  reserved?: boolean;
}

/** Chronic-medicine refill subscription. */
export interface Refill {
  id: string;
  patientId: string;
  medicineId: string;
  pharmacyId: string;
  quantity: number;
  everyDays: number;
  /** Date of the next automatic order (ISO). */
  nextDate: string;
  active: boolean;
}

export interface Interaction {
  /** Two generic (ingredient) names. */
  pair: [string, string];
  severity: "minor" | "moderate" | "major";
  message: string;
  /** Id of the medicine whose reviewing doctor added this pair. */
  source?: string;
}

/** Output of the caution engine. */
export interface CautionReport {
  items: { medicineId: string; brand: string; generic: string; cautions: string[]; uses: string[] }[];
  duplicates: { ingredient: string; brands: string[] }[];
  interactions: (Interaction & { brands: [string, string] })[];
  rxRequired: { medicineId: string; brand: string }[];
  disclaimer: string;
}

export type ConsultMode = "video" | "chat";

export type AppointmentStatus = "requested" | "approved" | "rescheduled" | "declined" | "cancelled" | "completed";

/** What a doctor offers to patients. One per doctor; patients only see verified doctors. */
export interface DoctorProfile {
  doctorId: string;
  /** One of SPECIALTIES (src/lib/specialties.ts). */
  specialty: string;
  qualifications: string;
  experienceYears: number;
  /** Consultation fee in BDT. */
  fee: number;
  bio: string;
  /** Conditions and symptoms this doctor treats (lowercase). The finder ranks doctors with these. */
  treats: string[];
  languages: string[];
  rating: number;
  /** false = on leave: cannot be booked, but stays listed so patients see the other doctors. */
  accepting: boolean;
  /** Working weekdays (0 = Sunday … 6 = Saturday) and daily start times "HH:MM". */
  days: number[];
  times: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  mode: ConsultMode;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
  /** The doctor's message with a decision (approve, reschedule or decline). */
  doctorNote?: string;
  /** The earlier slot, kept when the doctor reschedules. */
  previous?: { date: string; time: string };
  /** true while a demo video call is running, so the other side sees "Join". */
  callActive?: boolean;
}

export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

/** A test report the patient attached to an appointment (the file itself is not stored). */
export interface MedicalReport {
  id: string;
  appointmentId: string;
  patientId: string;
  fileName: string;
  note?: string;
  uploadedAt: string;
}

/** A booked slot. Carries no patient data, so patients can see which times are taken. */
export interface BusySlot {
  doctorId: string;
  date: string;
  time: string;
}
