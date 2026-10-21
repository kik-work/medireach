import fs from "node:fs";
import path from "node:path";
import { medicines } from "./medicines";
import { pharmacies } from "./pharmacies";
import { stock } from "./stock";
import { users } from "./users";
import { prescriptions } from "./prescriptions";
import { orders } from "./orders";
import { refills } from "./refills";
import { interactions } from "./interactions";
import { doctorProfiles } from "./doctors";
import { appointments } from "./appointments";
import { messages } from "./messages";
import { reports } from "./reports";
import { seedPasswords } from "./accounts";
import { hashPassword } from "@/lib/password";

/** Login credentials, kept apart from the public user record. */
export interface Account {
  userId: string;
  passwordHash: string;
}

/**
 * The server-side database: one JSON file (.data/db.json) that is created from the
 * seed files in this folder on first run. Every service mutates `db` and then calls
 * `save()`. Delete the file to reset to the sample data. No external database is used.
 */
const seed = () => ({
  medicines: structuredClone(medicines),
  pharmacies: structuredClone(pharmacies),
  stock: structuredClone(stock),
  users: structuredClone(users),
  accounts: [] as Account[],
  prescriptions: structuredClone(prescriptions),
  orders: structuredClone(orders),
  refills: structuredClone(refills),
  interactions: structuredClone(interactions),
  doctorProfiles: structuredClone(doctorProfiles),
  appointments: structuredClone(appointments),
  messages: structuredClone(messages),
  reports: structuredClone(reports),
});

export type Db = ReturnType<typeof seed>;

const seedAccounts = () =>
  users.map<Account>((u) => ({ userId: u.id, passwordHash: hashPassword(seedPasswords[u.id] ?? "changeme") }));

const FILE = path.join(process.cwd(), ".data", "db.json");

function load(): Db {
  try {
    const saved = JSON.parse(fs.readFileSync(FILE, "utf8")) as Partial<Db>;
    // Fill any collection added after the file was written.
    const merged = { ...seed(), ...saved, accounts: saved.accounts ?? seedAccounts() };
    // Add seeded doctors that an older file does not have yet.
    for (const u of users) {
      if (u.role !== "doctor" || merged.users.some((x) => x.id === u.id)) continue;
      merged.users.push(structuredClone(u));
      merged.accounts.push({ userId: u.id, passwordHash: hashPassword(seedPasswords[u.id] ?? "changeme") });
    }
    return merged;
  } catch {
    const fresh = { ...seed(), accounts: seedAccounts() };
    write(fresh);
    return fresh;
  }
}

function write(data: Db) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);
  } catch {
    // Read-only file system: data then lives in memory until the server restarts.
  }
}

const g = globalThis as unknown as { __medireachDb?: Db };
export const db: Db = (g.__medireachDb ??= load());

/** Persist the current state of `db`. Call after every mutation. */
export const save = () => write(db);

/** Next id like "m16": highest numeric suffix + 1, so deleted ids are never reused. */
export function nextId(prefix: string, ids: string[]) {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(prefix, "")) || 0), 0);
  return `${prefix}${max + 1}`;
}
