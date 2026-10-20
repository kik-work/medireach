import { NextResponse } from "next/server";
import { guard, readJson } from "@/lib/auth";
import { cleanItems, deletePrescription, getPrescription, updatePrescription } from "@/lib/services/prescription.service";

/** PATCH /api/prescriptions/:id { diagnosis?, items?, validUntil? } — the issuing doctor edits their prescription. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/prescriptions/[id]">) {
  const { user, res } = await guard("doctor");
  if (res) return res;
  const rx = getPrescription((await ctx.params).id);
  if (!rx) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
  if (rx.doctorId !== user.id) return NextResponse.json({ error: "Not your prescription." }, { status: 403 });
  if (user.status !== "verified") return NextResponse.json({ error: "Your registration must be verified." }, { status: 403 });

  const body = await readJson<{ diagnosis?: string; items?: unknown; validUntil?: string }>(req);
  const items = body.items === undefined ? undefined : cleanItems(body.items);
  if (items && items.length === 0) return NextResponse.json({ error: "Add at least one medicine." }, { status: 422 });
  return NextResponse.json({ data: updatePrescription(rx.id, { diagnosis: body.diagnosis, items, validUntil: body.validUntil }) });
}

/** DELETE /api/prescriptions/:id — a doctor revokes their own; a patient removes their own uploaded copy. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/prescriptions/[id]">) {
  const { user, res } = await guard("doctor", "patient");
  if (res) return res;
  const rx = getPrescription((await ctx.params).id);
  if (!rx) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
  const owns = user.role === "doctor" ? rx.doctorId === user.id : rx.patientId === user.id && rx.uploaded;
  if (!owns) return NextResponse.json({ error: "You cannot delete this prescription." }, { status: 403 });
  deletePrescription(rx.id);
  return NextResponse.json({ data: null });
}
