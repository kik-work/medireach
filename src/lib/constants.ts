import type { City, Role } from "@/lib/types";

export const APP_NAME = "MediReach";
export const CITIES: City[] = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"];
export const DEFAULT_CITY: City = "Dhaka";

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
