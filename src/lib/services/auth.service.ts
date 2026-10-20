import { db, save } from "@/lib/data";
import { CITIES } from "@/lib/constants";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { City, User } from "@/lib/types";
import { createUser, findByIdentifier } from "./user.service";
import { createPharmacy } from "./pharmacy.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10,15}$/;

/** Lowercases emails; reduces phones to digits (+880 / 880 prefix becomes 0). */
export function normalizeIdentifier(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v.includes("@")) return v;
  let digits = v.replace(/[^\d]/g, "");
  if (digits.startsWith("880")) digits = "0" + digits.slice(3);
  return digits;
}

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export interface SignupInput {
  name?: string;
  identifier?: string;
  password?: string;
  role?: string;
  city?: string;
  registrationNo?: string;
  pharmacyName?: string;
  licenseNo?: string;
  address?: string;
  phone?: string;
}

export function signup(input: SignupInput): AuthResult {
  const name = input.name?.trim() ?? "";
  const identifier = normalizeIdentifier(input.identifier ?? "");
  const registrationNo = input.registrationNo?.trim() ?? "";
  const role = input.role;
  const city = (CITIES.includes(input.city as City) ? input.city : "Dhaka") as City;

  if (role !== "patient" && role !== "doctor" && role !== "pharmacist") return { ok: false, error: "Choose an account type." };
  if (!name) return { ok: false, error: "Enter your full name." };
  if (!EMAIL_RE.test(identifier) && !PHONE_RE.test(identifier)) return { ok: false, error: "Enter a valid email or phone number." };
  if (role === "doctor" && !registrationNo) return { ok: false, error: "Enter your BMDC registration number." };
  if (role === "pharmacist") {
    if (!registrationNo) return { ok: false, error: "Enter your Pharmacy Council registration number." };
    if (!input.pharmacyName?.trim()) return { ok: false, error: "Enter your pharmacy name." };
    if (!input.licenseNo?.trim()) return { ok: false, error: "Enter your pharmacy licence number." };
  }
  if ((input.password ?? "").length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  if (findByIdentifier(identifier)) return { ok: false, error: "An account with this email or phone already exists." };

  let pharmacyId: string | undefined;
  if (role === "pharmacist") {
    pharmacyId = createPharmacy({
      name: input.pharmacyName!.trim(),
      city,
      area: "",
      address: input.address?.trim() || city,
      phone: input.phone?.trim() || (PHONE_RE.test(identifier) ? identifier : ""),
      licenseNo: input.licenseNo!.trim(),
    }).id;
  }

  const user = createUser({
    name,
    email: identifier,
    role,
    city,
    // Patients need no approval; doctors and pharmacists wait for the admin.
    status: role === "patient" ? "verified" : "pending",
    ...(role !== "patient" && { registrationNo }),
    ...(pharmacyId && { pharmacyId }),
  });
  db.accounts.push({ userId: user.id, passwordHash: hashPassword(input.password!) });
  save();
  return { ok: true, user };
}

/** `scope` keeps the two login forms apart: /login never accepts admin, /admin only accepts admin. */
export function login(rawIdentifier: string, password: string, scope: "public" | "admin"): AuthResult {
  const user = findByIdentifier(normalizeIdentifier(rawIdentifier));
  const account = user && db.accounts.find((a) => a.userId === user.id);
  const scopeOk = user && (scope === "admin" ? user.role === "admin" : user.role !== "admin");
  if (!user || !account || !scopeOk || !verifyPassword(password, account.passwordHash)) {
    return { ok: false, error: "Invalid email/phone or password." };
  }
  if (user.status === "suspended") return { ok: false, error: "This account is suspended. Contact the MediReach admin team." };
  return { ok: true, user };
}
