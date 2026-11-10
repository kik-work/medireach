import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/data";
import { addDays, today } from "@/lib/rules";
import { changeOrderStatus, placeOrder } from "@/lib/services/order.service";
import { freshDb, PATIENT, PHARMACY, prescribe, setStock, stockOf } from "./helpers";

const patient = () => db.users.find((u) => u.id === PATIENT)!;
const pharmacist = () => db.users.find((u) => u.role === "pharmacist" && u.pharmacyId === PHARMACY)!;
const admin = () => db.users.find((u) => u.role === "admin")!;
const line = (medicineId: string, quantity = 1, pharmacyId = PHARMACY) => ({ medicineId, pharmacyId, quantity });

beforeEach(() => {
  freshDb();
  setStock("m01", 50, 12);
  setStock("m12", 5, 18);
});

describe("prescription bridge (Rx gating)", () => {
  it("blocks an Rx-only medicine without a prescription", () => {
    const r = placeOrder(PATIENT, [line("m12")]);
    expect(r).toMatchObject({ ok: false, blocked: ["Warf"] });
    expect(stockOf("m12")).toBe(5);
  });

  it("allows it with a valid doctor prescription", () => {
    prescribe(["m12"]);
    expect(placeOrder(PATIENT, [line("m12")]).ok).toBe(true);
  });

  it("does not accept an expired prescription or an unreviewed upload", () => {
    prescribe(["m12"], { validUntil: addDays(today(), -1) });
    prescribe(["m12"], { uploaded: true, doctorId: "", review: { status: "pending" } });
    expect(placeOrder(PATIENT, [line("m12")]).ok).toBe(false);
  });

  it("sells over-the-counter medicines without a prescription", () => {
    expect(placeOrder(PATIENT, [line("m01", 2)]).ok).toBe(true);
  });

  it("refuses a pharmacy that is not verified", () => {
    setStock("m01", 10, 12, "ph8");
    expect(placeOrder(PATIENT, [line("m01", 1, "ph8")])).toMatchObject({ ok: false });
  });
});

describe("stock, pre-orders and status", () => {
  it("takes stock at placement and puts it back on cancel", () => {
    const r = placeOrder(PATIENT, [line("m01", 3)]);
    if (!r.ok) throw new Error(r.error);
    expect(r.orders[0]).toMatchObject({ status: "placed", total: 36, reserved: true });
    expect(stockOf("m01")).toBe(47);
    expect(changeOrderStatus(r.orders[0].id, "cancelled", patient()).ok).toBe(true);
    expect(stockOf("m01")).toBe(50);
  });

  it("makes a pre-order when the pharmacy cannot cover the quantity", () => {
    const r = placeOrder(PATIENT, [line("m01", 999)]);
    if (!r.ok) throw new Error(r.error);
    expect(r.orders[0]).toMatchObject({ status: "pre-order", reserved: false });
    expect(stockOf("m01")).toBe(50);
  });

  it("splits a cart into one order per pharmacy", () => {
    setStock("m01", 10, 11, "ph1");
    const r = placeOrder(PATIENT, [line("m01", 1), line("m01", 1, "ph1")]);
    expect(r.ok && r.orders.map((o) => o.pharmacyId).sort()).toEqual(["ph1", "ph3"]);
  });

  it("pharmacist moves an order one step at a time; the patient cannot", () => {
    const r = placeOrder(PATIENT, [line("m01")]);
    if (!r.ok) throw new Error(r.error);
    const id = r.orders[0].id;
    expect(changeOrderStatus(id, "packed", pharmacist())).toMatchObject({ ok: false, code: 422 });
    expect(changeOrderStatus(id, "confirmed", patient())).toMatchObject({ ok: false, code: 422 });
    for (const step of ["confirmed", "packed", "delivered"] as const) expect(changeOrderStatus(id, step, pharmacist()).ok).toBe(true);
    expect(changeOrderStatus(id, "cancelled", admin())).toMatchObject({ ok: false, code: 422 });
  });

  it("the patient cannot cancel once the pharmacy confirmed", () => {
    const r = placeOrder(PATIENT, [line("m01")]);
    if (!r.ok) throw new Error(r.error);
    changeOrderStatus(r.orders[0].id, "confirmed", pharmacist());
    expect(changeOrderStatus(r.orders[0].id, "cancelled", patient()).ok).toBe(false);
  });
});

describe("simulated payment", () => {
  it("cash on delivery is unpaid until delivered", () => {
    const r = placeOrder(PATIENT, [line("m01")]);
    if (!r.ok) throw new Error(r.error);
    const id = r.orders[0].id;
    expect(r.orders[0].payment).toEqual({ method: "cod", status: "unpaid" });
    for (const step of ["confirmed", "packed", "delivered"] as const) changeOrderStatus(id, step, pharmacist());
    expect(db.orders.find((o) => o.id === id)!.payment).toMatchObject({ method: "cod", status: "paid" });
  });

  it("a card is charged at once, masked, and refunded on cancel", () => {
    const r = placeOrder(PATIENT, [line("m01")], { payment: { method: "card", account: "4242 4242 4242 4242", expiry: "12/99" } });
    if (!r.ok) throw new Error(r.error);
    const p = r.orders[0].payment!;
    expect(p).toMatchObject({ method: "card", status: "paid", account: "4242" });
    expect(p.ref).toMatch(/^SIM-CD-/);
    expect(JSON.stringify(db.orders)).not.toContain("4242424242424242");
    changeOrderStatus(r.orders[0].id, "cancelled", patient());
    expect(db.orders.find((o) => o.id === r.orders[0].id)!.payment!.status).toBe("refunded");
  });

  it("rejects bad or declined payments before any stock moves", () => {
    const cases = [
      { method: "card", account: "4242 4242 4242 4241", expiry: "12/99" }, // fails Luhn
      { method: "card", account: "4242 4242 4242 4242", expiry: "01/20" }, // expired
      { method: "card", account: "4000 0000 0000 0002", expiry: "12/99" }, // test decline
      { method: "bkash", account: "12345" },
      { method: "bkash", account: "01710000000" }, // test decline
      { method: "crypto" },
    ];
    for (const payment of cases) expect(placeOrder(PATIENT, [line("m01")], { payment }).ok).toBe(false);
    expect(stockOf("m01")).toBe(50);
    expect(db.orders.filter((o) => o.patientId === PATIENT)).toEqual([]);
  });

  it("bKash pays each pharmacy's order with its own reference", () => {
    setStock("m01", 10, 11, "ph1");
    const r = placeOrder(PATIENT, [line("m01"), line("m01", 1, "ph1")], { payment: { method: "bkash", account: "01712345678" } });
    if (!r.ok) throw new Error(r.error);
    const refs = r.orders.map((o) => o.payment!.ref);
    expect(r.orders.every((o) => o.payment!.status === "paid" && o.payment!.account === "5678")).toBe(true);
    expect(new Set(refs).size).toBe(2);
  });
});
