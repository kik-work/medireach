import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { setUserStatus } from "@/lib/services/user.service";
import type { VerificationStatus } from "@/lib/types";

const STATUSES: VerificationStatus[] = ["pending", "verified", "rejected", "suspended"];

/** PATCH /api/users/:id { status } — admin verifies, rejects, suspends or reinstates a user. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const { res } = await guard("admin");
  if (res) return res;
  const { status } = await readJson<{ status?: VerificationStatus }>(req);
  if (!status || !STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 422 });
  const user = setUserStatus((await ctx.params).id, status);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ data: { id: user.id, status: user.status } });
}
