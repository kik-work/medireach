import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { saveProfile, type ProfileInput } from "@/lib/services/doctor.service";

/** PATCH /api/doctors/me { specialty?, qualifications?, experienceYears?, fee?, bio?, treats?, accepting? } — create or update the doctor's own profile. */
export async function PATCH(req: Request) {
  const { user, res } = await guard("doctor");
  if (res) return res;
  const result = saveProfile(user.id, await readJson<ProfileInput>(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ data: result.profile });
}
