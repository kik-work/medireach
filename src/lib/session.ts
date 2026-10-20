import type { Role, User, VerificationStatus } from "@/lib/types";

/** What the browser knows about the signed-in user. */
export interface Session {
  id: string;
  name: string;
  /** Email or phone used to log in. */
  identifier: string;
  role: Role;
  status: VerificationStatus;
  city: string;
  registrationNo?: string;
}

export const toSession = (u: User): Session => ({
  id: u.id,
  name: u.name,
  identifier: u.email,
  role: u.role,
  status: u.status,
  city: u.city,
  registrationNo: u.registrationNo,
});
