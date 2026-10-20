import { NextResponse } from "next/server";
import { readJson, startSession } from "@/lib/auth";
import { signup, type SignupInput } from "@/lib/services/auth.service";
import { toSession } from "@/lib/session";

/** POST /api/auth/signup — patient, doctor or pharmacist. Doctors and pharmacists start "pending". */
export async function POST(req: Request) {
  const result = signup(await readJson<SignupInput>(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  await startSession(result.user);
  return NextResponse.json({ data: toSession(result.user) }, { status: 201 });
}
