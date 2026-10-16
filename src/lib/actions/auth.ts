"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_HOME, SESSION_COOKIE } from "@/lib/constants";
import { primaryUserFor } from "@/lib/services/user.service";
import type { Role } from "@/lib/types";

/** Passwordless login: sign in as the primary user of a role. */
export async function loginAs(formData: FormData) {
  const role = formData.get("role") as Role;
  if (!(role in ROLE_HOME)) redirect("/login");
  const user = primaryUserFor(role);
  (await cookies()).set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(ROLE_HOME[role]);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
