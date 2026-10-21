import { db } from "@/lib/data";
import { isMedicineLive } from "@/lib/rules";

export function getPlatformStats() {
  return {
    medicines: db.medicines.filter(isMedicineLive).length,
    rareMedicines: db.medicines.filter((m) => isMedicineLive(m) && m.rare).length,
    medicinesAwaitingReview: db.medicines.filter((m) => m.review?.status === "pending").length,
    pharmacies: db.pharmacies.filter((p) => p.status === "verified").length,
    patients: db.users.filter((u) => u.role === "patient").length,
    doctors: db.users.filter((u) => u.role === "doctor" && u.status === "verified").length,
    orders: db.orders.length,
    revenue: db.orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
    pendingVerifications:
      db.users.filter((u) => u.status === "pending").length + db.pharmacies.filter((p) => p.status === "pending").length,
  };
}
