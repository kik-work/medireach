import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";
import type { Role, User } from "@/lib/types";
import { getUser } from "@/lib/services/user.service";

/** Session: the cookie only stores a user id. No passwords. */
export async function getSession(): Promise<User | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  return id ? (getUser(id) ?? null) : null;
}

/** Guard for role dashboards. Redirects to /login if the role does not match. */
export async function requireRole(role: Role): Promise<User> {
  const user = await getSession();
  if (!user || user.role !== role) redirect(`/login?role=${role}`);
  return user;
}
