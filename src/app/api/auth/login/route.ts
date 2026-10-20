import { NextResponse } from "next/server";
import { readJson, startSession } from "@/lib/auth";
import { login } from "@/lib/services/auth.service";
import { toSession } from "@/lib/session";

/** POST /api/auth/login { identifier, password, scope?: "public" | "admin" } */
export async function POST(req: Request) {
  const body = await readJson<{ identifier?: string; password?: string; scope?: string }>(req);
  const result = login(String(body.identifier ?? ""), String(body.password ?? ""), body.scope === "admin" ? "admin" : "public");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  await startSession(result.user);
  return NextResponse.json({ data: toSession(result.user) });
}
