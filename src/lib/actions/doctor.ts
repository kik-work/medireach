"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createPrescription } from "@/lib/services/prescription.service";

export async function issuePrescription(formData: FormData) {
  const doctor = await requireRole("doctor");
  const medicineIds = formData.getAll("medicineId").map(String);
  const doses = formData.getAll("dose").map(String);
  const days = formData.getAll("days").map(Number);

  // Rows are positional; zip first, then drop empty medicine slots.
  const items = medicineIds
    .map((medicineId, i) => ({ medicineId, dose: doses[i] || "As directed", days: days[i] || 5 }))
    .filter((item) => item.medicineId);
  if (!items.length) return;

  createPrescription({
    doctorId: doctor.id,
    patientId: String(formData.get("patientId")),
    diagnosis: String(formData.get("diagnosis") ?? ""),
    items,
  });
  revalidatePath("/doctor", "layout");
  redirect("/doctor/prescriptions");
}
