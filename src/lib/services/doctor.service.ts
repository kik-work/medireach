import { db, save } from "@/lib/data";
import { DEFAULT_DAYS, DEFAULT_TIMES } from "@/lib/consult";
import { SPECIALTY_NAMES } from "@/lib/specialties";
import type { DoctorProfile } from "@/lib/types";

export const getProfile = (doctorId: string) => db.doctorProfiles.find((p) => p.doctorId === doctorId);

const isVerifiedDoctor = (id: string) => db.users.some((u) => u.id === id && u.role === "doctor" && u.status === "verified");

/** Profiles patients may see and book: verified doctors only. */
export const listPublicProfiles = () => db.doctorProfiles.filter((p) => isVerifiedDoctor(p.doctorId));

export interface ProfileInput {
  specialty?: string;
  qualifications?: string;
  experienceYears?: number;
  fee?: number;
  bio?: string;
  /** Comma-separated conditions. */
  treats?: string;
  accepting?: boolean;
}

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
};

/** Creates the doctor's profile on first save, then updates it. */
export function saveProfile(doctorId: string, input: ProfileInput): { ok: true; profile: DoctorProfile } | { ok: false; error: string } {
  let profile = getProfile(doctorId);
  if (!profile && !SPECIALTY_NAMES.includes(input.specialty ?? "")) return { ok: false, error: "Choose your specialty." };
  if (input.specialty !== undefined && !SPECIALTY_NAMES.includes(input.specialty)) return { ok: false, error: "Choose a specialty from the list." };

  if (!profile) {
    profile = {
      doctorId, specialty: input.specialty!, qualifications: "", experienceYears: 0, fee: 800, bio: "", treats: [],
      languages: ["Bangla", "English"], rating: 0, accepting: true, days: DEFAULT_DAYS, times: DEFAULT_TIMES,
    };
    db.doctorProfiles.push(profile);
  }
  if (input.specialty) profile.specialty = input.specialty;
  if (input.qualifications !== undefined) profile.qualifications = input.qualifications.trim().slice(0, 120);
  if (input.experienceYears !== undefined) profile.experienceYears = clamp(input.experienceYears, 0, 60, profile.experienceYears);
  if (input.fee !== undefined) profile.fee = clamp(input.fee, 0, 20000, profile.fee);
  if (input.bio !== undefined) profile.bio = input.bio.trim().slice(0, 400);
  if (input.treats !== undefined) {
    profile.treats = [...new Set(input.treats.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
  }
  if (typeof input.accepting === "boolean") profile.accepting = input.accepting;
  save();
  return { ok: true, profile };
}
