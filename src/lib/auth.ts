import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import type { Role, User } from "@/lib/types";
import { getUser } from "@/lib/services/user.service";

// Dev fallback only. Set AUTH_SECRET in .env.local for any shared deployment.
const SECRET = process.env.AUTH_SECRET ?? "medireach-dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 7;

const sign = (userId: string) => createHmac("sha256", SECRET).update(userId).digest("hex");

/** Cookie value "<userId>.<signature>": only a user id, no password, tamper-proof. */
const encode = (userId: string) => `${userId}.${sign(userId)}`;

function decode(value: string | undefined): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 1) return null;
  const id = value.slice(0, i);
  const given = Buffer.from(value.slice(i + 1), "hex");
  const expected = Buffer.from(sign(id), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}

export async function startSession(user: User) {
  (await cookies()).set(SESSION_COOKIE, encode(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Route handlers call this to know who is asking. */
export async function getSession(): Promise<User | null> {
  const id = decode((await cookies()).get(SESSION_COOKIE)?.value);
  return id ? (getUser(id) ?? null) : null;
}

/** Result of an API guard: the user, or a ready-made error response. */
export type Guard = { user: User; res?: undefined } | { user?: undefined; res: Response };

/** Guard for API routes: 401 when signed out, 403 when the role is not allowed. */
export async function guard(...roles: Role[]): Promise<Guard> {
  const user = await getSession();
  if (!user) return { res: Response.json({ error: "Please log in." }, { status: 401 }) };
  if (roles.length && !roles.includes(user.role)) return { res: Response.json({ error: "Not allowed for your account type." }, { status: 403 }) };
  return { user };
}

/** Read a JSON body without throwing. */
export const readJson = async <T = Record<string, unknown>>(req: Request): Promise<T> =>
  ((await req.json().catch(() => ({}))) as T) ?? ({} as T);
