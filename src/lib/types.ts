/** Domain types shared by data, services, API routes and UI. */

export type Role = "patient" | "doctor" | "pharmacist" | "admin";

export type City = "Dhaka" | "Chattogram" | "Sylhet" | "Rajshahi" | "Khulna";

export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

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
}

export interface Interaction {
  /** Two generic (ingredient) names. */
  pair: [string, string];
  severity: "minor" | "moderate" | "major";
  message: string;
}

/** Output of the caution engine. */
export interface CautionReport {
  items: { medicineId: string; brand: string; generic: string; cautions: string[]; uses: string[] }[];
  duplicates: { ingredient: string; brands: string[] }[];
  interactions: (Interaction & { brands: [string, string] })[];
  rxRequired: { medicineId: string; brand: string }[];
  disclaimer: string;
}
