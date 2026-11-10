import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/data";
import { AI_DISCLAIMER } from "@/lib/constants";
import { addDays, today } from "@/lib/rules";
import { buildCautionReport, profileMedicines } from "@/lib/services/caution.service";
import { phraseCautionReport } from "@/lib/services/caution-phrasing.service";
import { freshDb, PATIENT, PHARMACY, prescribe } from "./helpers";

beforeEach(freshDb);

describe("caution layer (retrieval)", () => {
  it("flags two brands with the same active ingredient", () => {
    const report = buildCautionReport(["m01", "m02"]); // Napa + Ace, both paracetamol
    expect(report.duplicates).toEqual([{ ingredient: "paracetamol", brands: ["Napa", "Ace"] }]);
  });

  it("reports curated interactions with their severity", () => {
    const report = buildCautionReport(["m12", "m10"]); // warfarin + aspirin
    expect(report.interactions).toHaveLength(1);
    expect(report.interactions[0]).toMatchObject({ severity: "major", brands: ["Warf", "Ecosprin"] });
  });

  it("lists Rx-only medicines and always ends with the disclaimer", () => {
    const report = buildCautionReport(["m12", "m01"]);
    expect(report.rxRequired).toEqual([{ medicineId: "m12", brand: "Warf" }]);
    expect(report.disclaimer).toBe(AI_DISCLAIMER);
  });

  it("ignores unknown and unapproved medicines", () => {
    db.medicines.find((m) => m.id === "m02")!.review = { status: "pending" };
    const report = buildCautionReport(["m01", "m02", "nope"]);
    expect(report.items.map((i) => i.medicineId)).toEqual(["m01"]);
    expect(report.duplicates).toEqual([]);
  });

  it("finds no alerts for unrelated medicines", () => {
    const report = buildCautionReport(["m07", "m03"]);
    expect(report.duplicates).toEqual([]);
    expect(report.interactions).toEqual([]);
  });
});

describe("caution layer against the patient's profile", () => {
  it("collects prescriptions, active refills and recent orders, once per medicine", () => {
    prescribe(["m12"]);
    db.refills.push({ id: "rf-t", patientId: PATIENT, medicineId: "m03", pharmacyId: PHARMACY, quantity: 1, everyDays: 30, nextDate: today(), active: true });
    db.orders.push({ id: "ORD-T1", patientId: PATIENT, pharmacyId: PHARMACY, lines: [{ medicineId: "m02", quantity: 1, unitPrice: 10 }, { medicineId: "m12", quantity: 1, unitPrice: 10 }], total: 20, status: "delivered", createdAt: today() });
    db.orders.push({ id: "ORD-T2", patientId: PATIENT, pharmacyId: PHARMACY, lines: [{ medicineId: "m07", quantity: 1, unitPrice: 3 }], total: 3, status: "delivered", createdAt: addDays(today(), -60) });
    db.orders.push({ id: "ORD-T3", patientId: PATIENT, pharmacyId: PHARMACY, lines: [{ medicineId: "m09", quantity: 1, unitPrice: 5 }], total: 5, status: "cancelled", createdAt: today() });

    expect(profileMedicines(PATIENT)).toEqual([
      { medicineId: "m12", brand: "Warf", source: "prescription" },
      { medicineId: "m03", brand: "Seclo", source: "refill" },
      { medicineId: "m02", brand: "Ace", source: "order" },
    ]);
  });

  it("warns about a cart medicine that clashes with one on the profile", () => {
    prescribe(["m12"]); // warfarin
    const report = buildCautionReport(["m10"], { patientId: PATIENT }); // aspirin in the cart
    expect(report.profile).toEqual([{ medicineId: "m12", brand: "Warf", source: "prescription" }]);
    expect(report.interactions).toEqual([expect.objectContaining({ severity: "major", profile: true })]);
    // Profile medicines are context only: they get no caution card of their own.
    expect(report.items.map((i) => i.medicineId)).toEqual(["m10"]);
  });

  it("flags a duplicate ingredient with a medicine already on order", () => {
    db.orders.push({ id: "ORD-T4", patientId: PATIENT, pharmacyId: PHARMACY, lines: [{ medicineId: "m02", quantity: 1, unitPrice: 10 }], total: 10, status: "placed", createdAt: today() });
    const report = buildCautionReport(["m01"], { patientId: PATIENT });
    expect(report.duplicates).toEqual([{ ingredient: "paracetamol", brands: ["Napa", "Ace"], profileBrands: ["Ace"] }]);
  });

  it("does not report clashes between two profile medicines", () => {
    prescribe(["m12", "m10"]); // warfarin + aspirin, both already prescribed by the doctor
    const report = buildCautionReport(["m07"], { patientId: PATIENT });
    expect(report.interactions).toEqual([]);
  });

  it("does not count the medicine being bought as its own duplicate", () => {
    prescribe(["m01"]);
    const report = buildCautionReport(["m01"], { patientId: PATIENT });
    expect(report.duplicates).toEqual([]);
    expect(report.profile).toEqual([]);
  });
});

describe("caution phrasing", () => {
  it("is off without an API key, so pages fall back to the retrieval cards", async () => {
    expect(await phraseCautionReport(buildCautionReport(["m01", "m02"]))).toBeNull();
  });
});
