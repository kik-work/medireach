import { db } from "@/lib/data";
import type { Role, User, VerificationStatus } from "@/lib/types";

export const getUser = (id: string) => db.users.find((u) => u.id === id);
export const listUsers = (role?: Role) => db.users.filter((u) => !role || u.role === role);
export const listPending = () => db.users.filter((u) => u.status === "pending");

export function setUserStatus(id: string, status: VerificationStatus) {
  const u = getUser(id);
  if (u) u.status = status;
}

/** First verified user of a role (used by the passwordless login). */
export const primaryUserFor = (role: Role): User => db.users.find((u) => u.role === role && u.status === "verified")!;
