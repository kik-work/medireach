import { db, nextId, save } from "@/lib/data";
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

export type MedicineInput = Omit<Medicine, "id" | "slug" | "ingredients"> & { ingredients?: string[] };

const slugify = (m: Pick<Medicine, "brand" | "strength">) =>
  `${m.brand}-${m.strength}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Unique slug: appends -2, -3 … when another medicine already has it. */
function uniqueSlug(base: string, ownId?: string) {
  let slug = base;
  for (let n = 2; db.medicines.some((m) => m.slug === slug && m.id !== ownId); n++) slug = `${base}-${n}`;
  return slug;
}

export function addMedicine(input: MedicineInput) {
  const medicine: Medicine = {
    ...input,
    id: nextId("m", db.medicines.map((m) => m.id)),
    slug: uniqueSlug(slugify(input)),
    ingredients: input.ingredients?.length ? input.ingredients : [input.generic.toLowerCase()],
  };
  db.medicines.push(medicine);
  save();
  return medicine;
}

export function updateMedicine(id: string, input: MedicineInput) {
  const m = getMedicineById(id);
  if (!m) return undefined;
  Object.assign(m, input, {
    slug: uniqueSlug(slugify(input), id),
    ingredients: input.ingredients?.length ? input.ingredients : [input.generic.toLowerCase()],
  });
  save();
  return m;
}

/** Removes the medicine and every pharmacy listing of it. */
export function deleteMedicine(id: string) {
  const i = db.medicines.findIndex((m) => m.id === id);
  if (i < 0) return false;
  db.medicines.splice(i, 1);
  db.stock = db.stock.filter((s) => s.medicineId !== id);
  db.refills = db.refills.filter((r) => r.medicineId !== id);
  save();
  return true;
}
