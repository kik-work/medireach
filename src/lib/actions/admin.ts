"use server";

import { revalidatePath } from "next/cache";
import { addMedicine } from "@/lib/services/medicine.service";
import { setPharmacyStatus } from "@/lib/services/pharmacy.service";
import { setUserStatus } from "@/lib/services/user.service";
import { setOrderStatus } from "@/lib/services/order.service";
import type { Medicine, OrderStatus, VerificationStatus } from "@/lib/types";

// NOTE: admin actions are only reachable through /admin, which src/proxy.ts
// restricts to localhost.

export async function updateUserStatus(formData: FormData) {
  setUserStatus(String(formData.get("id")), String(formData.get("status")) as VerificationStatus);
  revalidatePath("/admin", "layout");
}

export async function updatePharmacyStatus(formData: FormData) {
  setPharmacyStatus(String(formData.get("id")), String(formData.get("status")) as VerificationStatus);
  revalidatePath("/admin", "layout");
}

export async function updateOrderStatus(formData: FormData) {
  setOrderStatus(String(formData.get("id")), String(formData.get("status")) as OrderStatus);
  revalidatePath("/admin", "layout");
}

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

export async function createMedicine(formData: FormData) {
  addMedicine({
    brand: String(formData.get("brand")),
    generic: String(formData.get("generic")),
    strength: String(formData.get("strength")),
    form: String(formData.get("form")) as Medicine["form"],
    manufacturer: String(formData.get("manufacturer")),
    category: String(formData.get("category")),
    rx: formData.get("rx") === "on",
    rare: formData.get("rare") === "on",
    price: Number(formData.get("price")) || 0,
    description: String(formData.get("description")),
    uses: lines(formData.get("uses")),
    cautions: lines(formData.get("cautions")),
    sideEffects: [],
  });
  revalidatePath("/admin/medicines");
  revalidatePath("/medicines");
}
