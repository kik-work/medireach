import { db } from "@/lib/data";
import type { Medicine } from "@/lib/types";

export interface MedicineFilter {
  q?: string;
  category?: string;
  rx?: "rx" | "otc";
  rareOnly?: boolean;
}

/** Search by brand, generic name, category or use (disease). */
export function listMedicines(filter: MedicineFilter = {}): Medicine[] {
  const q = filter.q?.trim().toLowerCase();
  return db.medicines.filter((m) => {
    if (q) {
      const hay = [m.brand, m.generic, m.category, ...m.uses].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filter.category && m.category !== filter.category) return false;
    if (filter.rx === "rx" && !m.rx) return false;
    if (filter.rx === "otc" && m.rx) return false;
    if (filter.rareOnly && !m.rare) return false;
    return true;
  });
}

export const getMedicineBySlug = (slug: string) => db.medicines.find((m) => m.slug === slug);
export const getMedicineById = (id: string) => db.medicines.find((m) => m.id === id);
export const listCategories = () => [...new Set(db.medicines.map((m) => m.category))].sort();

/** Other brands that share an active ingredient with this medicine. */
export function sameIngredientBrands(medicine: Medicine): Medicine[] {
  return db.medicines.filter(
    (m) => m.id !== medicine.id && m.ingredients.some((i) => medicine.ingredients.includes(i)),
  );
}

export function addMedicine(input: Omit<Medicine, "id" | "slug" | "ingredients"> & { ingredients?: string[] }) {
  const slug = `${input.brand}-${input.strength}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const medicine: Medicine = {
    ...input,
    id: `m${String(db.medicines.length + 1).padStart(2, "0")}`,
    slug,
    ingredients: input.ingredients ?? [input.generic.toLowerCase()],
  };
  db.medicines.push(medicine);
  return medicine;
}
