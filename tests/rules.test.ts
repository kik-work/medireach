import { describe, expect, it } from "vitest";
import { addDays, isMedicineLive, isPrescriptionValid, prescribedMedicineIds, prescriptionState, today } from "@/lib/rules";
import type { Prescription } from "@/lib/types";

const rx = (patch: Partial<Prescription> = {}): Prescription => ({
  id: "rx1", doctorId: "d1", patientId: "p1", issuedAt: today(), validUntil: addDays(today(), 5),
  diagnosis: "x", items: [{ medicineId: "m04", dose: "1", days: 5 }], ...patch,
});

describe("dates", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-10", -10)).toBe("2026-02-28");
  });
});

describe("prescription rules", () => {
  it("a doctor-issued prescription is valid until it expires", () => {
    expect(isPrescriptionValid(rx())).toBe(true);
    expect(prescriptionState(rx({ validUntil: addDays(today(), -1) }))).toBe("expired");
  });

  it("an uploaded copy counts only after an admin approved it", () => {
    expect(prescriptionState(rx({ uploaded: true, review: { status: "pending" } }))).toBe("pending");
    expect(prescriptionState(rx({ uploaded: true, review: { status: "rejected" } }))).toBe("rejected");
    expect(isPrescriptionValid(rx({ uploaded: true, review: { status: "pending" } }))).toBe(false);
    expect(isPrescriptionValid(rx({ uploaded: true, review: { status: "approved" } }))).toBe(true);
  });

  it("prescribed medicines come from the patient's valid prescriptions only", () => {
    const list = [
      rx(),
      rx({ id: "rx2", items: [{ medicineId: "m05", dose: "1", days: 5 }], validUntil: addDays(today(), -1) }),
      rx({ id: "rx3", patientId: "someone-else", items: [{ medicineId: "m06", dose: "1", days: 5 }] }),
    ];
    expect(prescribedMedicineIds(list, "p1")).toEqual(["m04"]);
  });
});

describe("medicine review", () => {
  it("only approved (or starter) medicines are live", () => {
    expect(isMedicineLive({})).toBe(true);
    expect(isMedicineLive({ review: { status: "approved" } })).toBe(true);
    expect(isMedicineLive({ review: { status: "pending" } })).toBe(false);
  });
});
