import { doctorUsers } from "./doctors";

/** Demo passwords for the seed users (hashed when the database is first created). */
export const seedPasswords: Record<string, string> = {
  ...Object.fromEntries(doctorUsers.map((d) => [d.id, "doctor123"])),
  "u-pat1": "patient123",
  "u-pat2": "patient123",
  "u-pat3": "patient123",
  "u-ph1": "pharmacist123",
  "u-ph2": "pharmacist123",
  "u-admin": "admin123",
};
