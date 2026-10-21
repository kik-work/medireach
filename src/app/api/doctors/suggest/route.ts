import { NextResponse } from "next/server";
import { readJson } from "@/lib/auth";
import { findDoctors } from "@/lib/services/triage.service";

/** POST /api/doctors/suggest { query } → specialties that fit the symptoms, with the verified doctors of each (AI doctor finder). */
export async function POST(req: Request) {
  const { query } = await readJson<{ query?: unknown }>(req);
  if (typeof query !== "string" || query.trim().length < 2) {
    return NextResponse.json({ error: "Describe your symptoms or condition." }, { status: 400 });
  }
  return NextResponse.json({ data: findDoctors(query) });
}
