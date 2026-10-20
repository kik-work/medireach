/**
 * Client-side demo auth. No server, no real security.
 * Order on login: hardcoded accounts first, then accounts saved in localStorage.
 */

export type AuthRole = "patient" | "doctor" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  /** Email or phone, normalised (see normalizeIdentifier). */
  identifier: string;
  password: string;
  role: AuthRole;
  /** BMDC number, doctors only. */
  registrationNo?: string;
}

export type Session = Omit<AuthUser, "password">;

export const USERS_KEY = "mr_users";
export const SESSION_KEY = "mr_session";
const STORE_EVENT = "mr-store-change";

export const AUTH_HOME: Record<AuthRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  admin: "/admin",
};

/**
 * Hardcoded accounts. Email or phone both work as the login id.
 * Ids match the seed users in lib/data/users.ts, so seed prescriptions and orders belong to them.
 */
export const HARDCODED_USERS: AuthUser[] = [
  { id: "u-pat1", name: "Rahim Uddin", identifier: "patient@medireach.com", password: "patient123", role: "patient" },
  { id: "u-pat2", name: "Nusrat Jahan", identifier: "01711111111", password: "patient123", role: "patient" },
  { id: "u-doc1", name: "Dr. Farhana Akter", identifier: "doctor@medireach.com", password: "doctor123", role: "doctor", registrationNo: "BMDC-A-45821" },
  { id: "u-doc2", name: "Dr. Imran Hossain", identifier: "01822222222", password: "doctor123", role: "doctor", registrationNo: "BMDC-A-51377" },
  { id: "u-admin", name: "System Admin", identifier: "admin@medireach.com", password: "admin123", role: "admin" },
];

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

export function isValidIdentifier(normalized: string): boolean {
  return EMAIL_RE.test(normalized) || PHONE_RE.test(normalized);
}

/** Accounts created through sign up (not the hardcoded ones). */
export function readLocalUsers(): AuthUser[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Raw JSON string of sign-ups, so useSyncExternalStore gets a stable snapshot. */
export function getUsersSnapshot(): string | null {
  try {
    return localStorage.getItem(USERS_KEY);
  } catch {
    return null;
  }
}

export function parseLocalUsers(raw: string | null): AuthUser[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const findIn = (list: AuthUser[], id: string) => list.find((u) => u.identifier === id);

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

function toSession(user: AuthUser): Session {
  return { id: user.id, name: user.name, identifier: user.identifier, role: user.role, registrationNo: user.registrationNo };
}

/** Tell every useSyncExternalStore reader that localStorage changed in this tab. */
export function notifyStore() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

function writeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: session lives only until reload.
  }
  notifyStore();
}

export function signup(input: {
  name: string;
  identifier: string;
  password: string;
  role: "patient" | "doctor";
  registrationNo?: string;
}): AuthResult {
  const name = input.name.trim();
  const identifier = normalizeIdentifier(input.identifier);
  const registrationNo = input.registrationNo?.trim();
  if (!name) return { ok: false, error: "Enter your full name." };
  if (!isValidIdentifier(identifier)) return { ok: false, error: "Enter a valid email or phone number." };
  if (input.role === "doctor" && !registrationNo) return { ok: false, error: "Enter your BMDC registration number." };
  if (input.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const users = readLocalUsers();
  if (findIn(HARDCODED_USERS, identifier) || findIn(users, identifier)) {
    return { ok: false, error: "An account with this email or phone already exists." };
  }
  const user: AuthUser = {
    id: `u-${Date.now().toString(36)}`,
    name,
    identifier,
    password: input.password,
    role: input.role,
    ...(input.role === "doctor" && { registrationNo }),
  };
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  } catch {
    return { ok: false, error: "Could not save your account. Allow site storage and try again." };
  }
  const session = toSession(user);
  writeSession(session);
  return { ok: true, session };
}

/** `scope` keeps the two login forms apart: /login never accepts admin, /admin only accepts admin. */
export function login(rawIdentifier: string, password: string, scope: "public" | "admin"): AuthResult {
  const identifier = normalizeIdentifier(rawIdentifier);
  const user = findIn(HARDCODED_USERS, identifier) ?? findIn(readLocalUsers(), identifier);
  const roleAllowed = user && (scope === "admin" ? user.role === "admin" : user.role !== "admin");
  if (!user || !roleAllowed || user.password !== password) {
    return { ok: false, error: "Invalid email/phone or password." };
  }
  const session = toSession(user);
  writeSession(session);
  return { ok: true, session };
}

export function logout() {
  writeSession(null);
}

// --- external store for React (useSyncExternalStore) ---

export function subscribeStore(onChange: () => void) {
  window.addEventListener(STORE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STORE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Raw JSON string, so the snapshot is referentially stable between reads. */
export function getSessionSnapshot(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    return s && typeof s.id === "string" && s.role in AUTH_HOME ? s : null;
  } catch {
    return null;
  }
}
