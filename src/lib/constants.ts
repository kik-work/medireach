import type { City, PaymentMethod, Role } from "@/lib/types";

export const APP_NAME = "MediReach";
export const CITIES: City[] = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"];
export const DEFAULT_CITY: City = "Dhaka";

/** City centres, used for pharmacies that have no map position yet. */
export const CITY_CENTER: Record<City, { lat: number; lng: number }> = {
  Dhaka: { lat: 23.8103, lng: 90.4125 },
  Chattogram: { lat: 22.3569, lng: 91.7832 },
  Sylhet: { lat: 24.8949, lng: 91.8687 },
  Rajshahi: { lat: 24.3745, lng: 88.6042 },
  Khulna: { lat: 22.8456, lng: 89.5403 },
};

/** "Nearby" radius when the user shares their location. */
export const NEARBY_KM = 10;

export const AI_DISCLAIMER = "This is general information. Follow your doctor's instructions.";

export const SESSION_COOKIE = "mr_session";

export const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient",
  doctor: "Doctor",
  pharmacist: "Pharmacist",
  admin: "Admin",
};

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor",
  pharmacist: "/pharmacist",
  admin: "/admin",
};

export const formatBDT = (n: number) => `৳${n.toLocaleString("en-US")}`;

/** Shared page container: wider on large screens. */
export const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[92rem]";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = { cod: "Cash on delivery", bkash: "bKash", card: "Card" };
