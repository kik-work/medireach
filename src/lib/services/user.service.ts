import { db, nextId, save } from "@/lib/data";
import type { City, Role, User, VerificationStatus } from "@/lib/types";

export const getUser = (id: string) => db.users.find((u) => u.id === id);
export const listUsers = (role?: Role) => db.users.filter((u) => !role || u.role === role);
export const findByIdentifier = (identifier: string) => db.users.find((u) => u.email === identifier);

export function setUserStatus(id: string, status: VerificationStatus) {
  const u = getUser(id);
  if (!u || u.role === "admin") return undefined;
  u.status = status;
  save();
  return u;
}

export function createUser(input: Omit<User, "id">): User {
  const user: User = { ...input, id: nextId("u-", db.users.map((u) => u.id)) };
  db.users.push(user);
  return user;
}

export function updateProfile(id: string, patch: { name?: string; city?: City }) {
  const u = getUser(id);
  if (!u) return undefined;
  if (patch.name?.trim()) u.name = patch.name.trim();
  if (patch.city) u.city = patch.city;
  save();
  return u;
}
