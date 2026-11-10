import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/data";
import { addDays, today } from "@/lib/rules";
import { runDueRefills, updateRefill } from "@/lib/services/refill.service";
import type { Refill } from "@/lib/types";
import { freshDb, PATIENT, PHARMACY, prescribe, setStock } from "./helpers";

const refill = (patch: Partial<Refill> = {}): Refill => {
  const r: Refill = { id: `rf-t${db.refills.length + 1}`, patientId: PATIENT, medicineId: "m01", pharmacyId: PHARMACY, quantity: 2, everyDays: 30, nextDate: today(), active: true, autoOrder: true, ...patch };
  db.refills.push(r);
  return r;
};

beforeEach(() => {
  freshDb();
  setStock("m01", 50);
  setStock("m12", 50);
});

describe("automatic refills", () => {
  it("places a due refill once and schedules the next one", () => {
    const r = refill();
    const runs = runDueRefills({ patientId: PATIENT });
    expect(runs).toEqual([expect.objectContaining({ refillId: r.id, ok: true })]);
    const order = db.orders.find((o) => o.id === r.lastOrderId)!;
    expect(order).toMatchObject({ refillId: r.id, patientId: PATIENT, payment: { method: "cod", status: "unpaid" } });
    expect(r.nextDate).toBe(addDays(today(), 30));
    expect(runDueRefills({ patientId: PATIENT })).toEqual([]);
  });

  it("leaves refills alone that are not due, paused, or without auto-order", () => {
    refill({ nextDate: addDays(today(), 1) });
    refill({ active: false });
    refill({ autoOrder: false });
    expect(runDueRefills()).toEqual([]);
  });

  it("does not order an Rx medicine without a prescription, and tries again only the next day", () => {
    const r = refill({ medicineId: "m12" });
    expect(runDueRefills()[0]).toMatchObject({ ok: false });
    expect(r.lastError).toMatch(/prescription/i);
    expect(r.nextDate).toBe(today());
    expect(runDueRefills()).toEqual([]);

    prescribe(["m12"]);
    expect(runDueRefills({ on: addDays(today(), 1) })[0]).toMatchObject({ ok: true });
    expect(r.lastError).toBeUndefined();
  });

  it("skips suspended patients", () => {
    refill();
    db.users.find((u) => u.id === PATIENT)!.status = "suspended";
    expect(runDueRefills()).toEqual([]);
  });

  it("switching auto-order on clears an earlier failure so it is tried again today", () => {
    const r = refill({ medicineId: "m12" });
    runDueRefills();
    prescribe(["m12"]);
    updateRefill(r.id, { autoOrder: true });
    expect(runDueRefills()[0]).toMatchObject({ ok: true });
  });
});
