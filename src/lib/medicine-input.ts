import type { Medicine } from "@/lib/types";
import type { MedicineInput } from "@/lib/services/medicine.service";

const FORMS: Medicine["form"][] = ["Tablet", "Capsule", "Syrup", "Injection"];

const list = (v: unknown) =>
  (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((s) => String(s).trim()).filter(Boolean);

/** Validates admin input for a medicine (create or edit). */
export function cleanMedicine(raw: Record<string, unknown>): { ok: true; value: MedicineInput } | { ok: false; error: string } {
  const str = (k: string) => String(raw[k] ?? "").trim();
  const required = ["brand", "generic", "strength", "manufacturer", "category", "description"];
  const missing = required.find((k) => !str(k));
  if (missing) return { ok: false, error: `${missing[0].toUpperCase()}${missing.slice(1)} is required.` };
  const price = Number(raw.price);
  if (!(price >= 0)) return { ok: false, error: "Price must be 0 or more." };
  const form = str("form") as Medicine["form"];
  if (!FORMS.includes(form)) return { ok: false, error: "Choose a form." };
  const ingredients = list(raw.ingredients).map((i) => i.toLowerCase());

  return {
    ok: true,
    value: {
      brand: str("brand"),
      generic: str("generic"),
      strength: str("strength"),
      form,
      manufacturer: str("manufacturer"),
      category: str("category"),
      rx: raw.rx === true || raw.rx === "on",
      rare: raw.rare === true || raw.rare === "on",
      price,
      description: str("description"),
      uses: list(raw.uses),
      cautions: list(raw.cautions),
      sideEffects: list(raw.sideEffects),
      ...(ingredients.length && { ingredients }),
    },
  };
}
