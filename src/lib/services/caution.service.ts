import { db } from "@/lib/data";
import { AI_DISCLAIMER } from "@/lib/constants";
import type { CautionReport } from "@/lib/types";

/**
 * AI caution layer (retrieval, not free generation).
 * Every fact comes from the curated medicine + interaction tables.
 * The layer only annotates; it never recommends or changes a treatment.
 */
export function buildCautionReport(medicineIds: string[]): CautionReport {
  const meds = [...new Set(medicineIds)]
    .map((id) => db.medicines.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  // Duplicate active ingredients across different brands.
  const byIngredient = new Map<string, string[]>();
  for (const m of meds) {
    for (const ing of m.ingredients) {
      byIngredient.set(ing, [...(byIngredient.get(ing) ?? []), m.brand]);
    }
  }
  const duplicates = [...byIngredient.entries()]
    .filter(([, brands]) => brands.length > 1)
    .map(([ingredient, brands]) => ({ ingredient, brands }));

  // Pairwise interactions from the curated table.
  const ingredientToBrand = new Map(meds.flatMap((m) => m.ingredients.map((i) => [i, m.brand] as const)));
  const interactions = db.interactions
    .filter(({ pair }) => ingredientToBrand.has(pair[0]) && ingredientToBrand.has(pair[1]))
    .map((i) => ({ ...i, brands: [ingredientToBrand.get(i.pair[0])!, ingredientToBrand.get(i.pair[1])!] as [string, string] }));

  return {
    items: meds.map((m) => ({ medicineId: m.id, brand: m.brand, generic: m.generic, cautions: m.cautions, uses: m.uses })),
    duplicates,
    interactions,
    rxRequired: meds.filter((m) => m.rx).map((m) => ({ medicineId: m.id, brand: m.brand })),
    disclaimer: AI_DISCLAIMER,
  };
}
