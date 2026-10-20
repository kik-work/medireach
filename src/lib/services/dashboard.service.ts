import { db } from "@/lib/data";
import type { DashboardData, DashUser } from "@/lib/dashboard-types";
import type { User } from "@/lib/types";
import { listOrders } from "./order.service";

const toDash = (u: User, withContact: boolean): DashUser => ({
  id: u.id,
  name: u.name,
  identifier: withContact ? u.email : "",
  role: u.role,
  status: u.status,
  registrationNo: u.registrationNo,
  city: u.city,
  pharmacyId: u.pharmacyId,
});

/** Builds the data one signed-in user may see. Personal data of other users is never included. */
export function getDashboardData(me: User): DashboardData {
  const base = {
    me: toDash(me, true),
    medicines: db.medicines,
    interactionCount: db.interactions.length,
  };

  switch (me.role) {
    case "patient":
      return {
        ...base,
        pharmacies: db.pharmacies.filter((p) => p.status === "verified"),
        stock: db.stock,
        users: db.users.filter((u) => u.role === "doctor" && u.status === "verified").map((u) => toDash(u, false)),
        prescriptions: db.prescriptions.filter((r) => r.patientId === me.id),
        orders: listOrders({ patientId: me.id }),
        refills: db.refills.filter((r) => r.patientId === me.id),
      };

    case "doctor":
      return {
        ...base,
        pharmacies: [],
        stock: [],
        // Only verified patients can receive a prescription.
        users: db.users.filter((u) => u.role === "patient" && u.status === "verified").map((u) => toDash(u, false)),
        prescriptions: db.prescriptions.filter((r) => r.doctorId === me.id),
        orders: [],
        refills: [],
      };

    case "pharmacist": {
      const pharmacyId = me.pharmacyId ?? "";
      const orders = listOrders({ pharmacyId });
      const customerIds = new Set(orders.map((o) => o.patientId));
      return {
        ...base,
        pharmacies: db.pharmacies.filter((p) => p.id === pharmacyId),
        stock: db.stock.filter((s) => s.pharmacyId === pharmacyId),
        users: db.users.filter((u) => customerIds.has(u.id)).map((u) => toDash(u, false)),
        // Prescriptions of this pharmacy's customers, so Rx orders can be checked.
        prescriptions: db.prescriptions.filter((r) => customerIds.has(r.patientId)),
        orders,
        refills: [],
      };
    }

    case "admin":
      return {
        ...base,
        pharmacies: db.pharmacies,
        stock: db.stock,
        users: db.users.filter((u) => u.role !== "admin").map((u) => toDash(u, true)),
        prescriptions: db.prescriptions,
        orders: listOrders(),
        refills: db.refills,
      };
  }
}
