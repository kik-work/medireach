import { db } from "@/lib/data";
import { AI_DISCLAIMER } from "@/lib/constants";
import { addDays, isMedicineLive, isPrescriptionValid, today } from "@/lib/rules";
import type { CautionReport, Medicine, ProfileMedicine, ProfileSource } from "@/lib/types";

/** How far back delivered or open orders count as "medicines the patient is taking". */
export const PROFILE_ORDER_DAYS = 30;

const liveMedicine = (id: string) => db.medicines.find((m) => m.id === id && isMedicineLive(m));

/**
 * Medicines on the patient's profile: items of valid prescriptions, active refills,
 * and orders from the last PROFILE_ORDER_DAYS days that were not cancelled.
 * One row per medicine; the first source found wins (prescription, then refill, then order).
 */
export function profileMedicines(patientId: string): ProfileMedicine[] {
  const since = addDays(today(), -PROFILE_ORDER_DAYS);
  const found: { medicineId: string; source: ProfileSource }[] = [
    ...db.prescriptions
      .filter((r) => r.patientId === patientId && isPrescriptionValid(r))
      .flatMap((r) => r.items.map((i) => ({ medicineId: i.medicineId, source: "prescription" as const }))),
    ...db.refills.filter((r) => r.patientId === patientId && r.active).map((r) => ({ medicineId: r.medicineId, source: "refill" as const })),
    ...db.orders
      .filter((o) => o.patientId === patientId && o.status !== "cancelled" && o.createdAt >= since)
      .flatMap((o) => o.lines.map((l) => ({ medicineId: l.medicineId, source: "order" as const }))),
  ];
  const seen = new Set<string>();
  const out: ProfileMedicine[] = [];
  for (const f of found) {
    const m = liveMedicine(f.medicineId);
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push({ medicineId: m.id, brand: m.brand, source: f.source });
  }
  return out;
}

/**
 * AI caution layer (retrieval, not free generation).
 * Every fact comes from the curated medicine + interaction tables.
 * The layer only annotates; it never recommends or changes a treatment.
 *
 * With `patientId`, the medicines on that patient's profile are checked too: a duplicate
 * ingredient or interaction is reported when at least one side is in `medicineIds`.
 */
export function buildCautionReport(medicineIds: string[], opts: { patientId?: string } = {}): CautionReport {
  const meds = [...new Set(medicineIds)].map(liveMedicine).filter((m): m is Medicine => Boolean(m));
  const currentIds = new Set(meds.map((m) => m.id));

  const profile = opts.patientId ? profileMedicines(opts.patientId).filter((p) => !currentIds.has(p.medicineId)) : [];
  const profileMeds = profile.map((p) => liveMedicine(p.medicineId)!);

  // Every medicine in the check, marked as current (cart/page) or from the profile.
  const all = [...meds.map((m) => ({ m, fromProfile: false })), ...profileMeds.map((m) => ({ m, fromProfile: true }))];

  // Duplicate active ingredients across different brands.
  const byIngredient = new Map<string, typeof all>();
  for (const entry of all) {
    for (const ing of entry.m.ingredients) byIngredient.set(ing, [...(byIngredient.get(ing) ?? []), entry]);
  }
  const duplicates = [...byIngredient.entries()]
    .filter(([, list]) => list.length > 1 && list.some((e) => !e.fromProfile))
    .map(([ingredient, list]) => {
      const profileBrands = list.filter((e) => e.fromProfile).map((e) => e.m.brand);
      return { ingredient, brands: list.map((e) => e.m.brand), ...(profileBrands.length && { profileBrands }) };
    });

  // Pairwise interactions from the curated table; at least one side must be a current medicine.
  const interactions: CautionReport["interactions"] = [];
  const reported = new Set<string>();
  for (const i of db.interactions) {
    const left = byIngredient.get(i.pair[0]) ?? [];
    const right = byIngredient.get(i.pair[1]) ?? [];
    for (const a of left) {
      for (const b of right) {
        if (a.m.id === b.m.id || (a.fromProfile && b.fromProfile)) continue;
        const key = `${i.pair.join("+")}:${[a.m.id, b.m.id].sort().join("+")}`;
        if (reported.has(key)) continue;
        reported.add(key);
        interactions.push({ ...i, brands: [a.m.brand, b.m.brand], ...((a.fromProfile || b.fromProfile) && { profile: true }) });
      }
    }
  }

  return {
    items: meds.map((m) => ({ medicineId: m.id, brand: m.brand, generic: m.generic, cautions: m.cautions, uses: m.uses })),
    duplicates,
    interactions,
    rxRequired: meds.filter((m) => m.rx).map((m) => ({ medicineId: m.id, brand: m.brand })),
    ...(opts.patientId && { profile }),
    disclaimer: AI_DISCLAIMER,
  };
}
