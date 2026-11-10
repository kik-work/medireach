import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { db } from "@/lib/data";
import { getPrescription } from "@/lib/services/prescription.service";
import { readUpload } from "@/lib/uploads";

/**
 * GET /api/prescriptions/:id/file — the photo or PDF of an uploaded prescription.
 * Who may see it: the patient who uploaded it, an admin, and a pharmacist whose pharmacy has an order from that patient.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/prescriptions/[id]/file">) {
  const { user, res } = await guard("patient", "admin", "pharmacist");
  if (res) return res;
  const rx = getPrescription((await ctx.params).id);
  const allowed =
    rx?.uploaded &&
    (user.role === "admin" ||
      (user.role === "patient" && rx.patientId === user.id) ||
      (user.role === "pharmacist" && user.pharmacyId && db.orders.some((o) => o.pharmacyId === user.pharmacyId && o.patientId === rx.patientId)));
  if (!rx || !allowed) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });

  const bytes = rx.fileType ? readUpload(rx.id) : null;
  if (!bytes) return NextResponse.json({ error: "No file is stored for this prescription." }, { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": rx.fileType!,
      "Content-Disposition": `inline; filename="${(rx.fileName ?? rx.id).replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
