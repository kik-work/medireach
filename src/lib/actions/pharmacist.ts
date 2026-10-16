"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { setOrderStatus } from "@/lib/services/order.service";
import { updateStock } from "@/lib/services/pharmacy.service";
import type { OrderStatus } from "@/lib/types";

export async function saveStock(formData: FormData) {
  const user = await requireRole("pharmacist");
  updateStock(
    user.pharmacyId!,
    String(formData.get("medicineId")),
    Math.max(0, Number(formData.get("quantity")) || 0),
    Math.max(0, Number(formData.get("price")) || 0),
  );
  revalidatePath("/pharmacist", "layout");
}

export async function advanceOrder(formData: FormData) {
  await requireRole("pharmacist");
  setOrderStatus(String(formData.get("id")), String(formData.get("status")) as OrderStatus);
  revalidatePath("/pharmacist", "layout");
}
