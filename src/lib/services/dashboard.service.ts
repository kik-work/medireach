import { db } from "@/lib/data";
import type { DashboardData, DashUser } from "@/lib/dashboard-types";
import type { User } from "@/lib/types";
import { busySlots, listForUser } from "./appointment.service";
import { isMedicineLive } from "@/lib/rules";
import { listPublicProfiles } from "./doctor.service";
import { listAllMedicines, listPendingMedicines, listSubmittedBy } from "./medicine.service";
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

const consult = (doctorProfiles: DashboardData["doctorProfiles"], appointments: DashboardData["appointments"], busy: DashboardData["busy"]) => ({ doctorProfiles, appointments, busy });

/** Builds the data one signed-in user may see. Personal data of other users is never included. */
export function getDashboardData(me: User): DashboardData {
  const appointments = me.role === "patient" || me.role === "doctor" ? listForUser(me) : [];
  const base = {
    me: toDash(me, true),
    // Only approved medicines are live. Admin sees all; a doctor also gets the ones waiting for review.
    // A pharmacist gets only their own proposals that are not live yet.
    medicines: me.role === "admin" ? listAllMedicines() : db.medicines.filter(isMedicineLive),
    pendingMedicines: me.role === "doctor" ? listPendingMedicines() : me.role === "pharmacist" ? listSubmittedBy(me.id) : [],
    interactionCount: db.interactions.length,
  };

  switch (me.role) {
    case "patient":
      return {
        ...base,
        pharmacies: db.pharmacies.filter((p) => p.status === "verified"),
        stock: db.stock,
        // Verified doctors, plus any doctor of this patient's appointments (so names never go missing).
        users: db.users.filter((u) => u.role === "doctor" && (u.status === "verified" || appointments.some((a) => a.doctorId === u.id))).map((u) => toDash(u, false)),
        prescriptions: db.prescriptions.filter((r) => r.patientId === me.id),
        orders: listOrders({ patientId: me.id }),
        refills: db.refills.filter((r) => r.patientId === me.id),
        ...consult(listPublicProfiles(), appointments, busySlots()),
      };

    case "doctor":
      return {
        ...base,
        pharmacies: [],
        stock: [],
        // Only verified patients can receive a prescription.
        users: db.users.filter((u) => u.role === "patient" && (u.status === "verified" || appointments.some((a) => a.patientId === u.id))).map((u) => toDash(u, false)),
        prescriptions: db.prescriptions.filter((r) => r.doctorId === me.id),
        orders: [],
        refills: [],
        ...consult(db.doctorProfiles.filter((p) => p.doctorId === me.id), appointments, busySlots(me.id)),
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
        ...consult([], [], []),
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
        // Consultations are private health data, so admins see the doctor profiles only.
        ...consult(db.doctorProfiles, [], []),
      };
  }
}
